// Server: Document management routes

import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { prisma } from '../../lib/prisma.js';
import { protect, restrictTo, AuthRequest } from '../../middleware/auth.js';
import { storageService } from '../../storage/minio.client.js';
import { ingestionQueue } from '../../queue/ingestion.queue.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { config } from '../../config/index.js';

const router = Router();

// Configure Multer for memory storage (files buffered in RAM)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_FILE_SIZE },
});

// Allowed MIME types for upload
const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * POST /api/documents
 * Upload a document (ADMIN only). Stores in MinIO, creates DB record,
 * and enqueues an ingestion job for async processing.
 */
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new HttpError(400, 'BAD_REQUEST', 'No file uploaded');
      }

      const { originalname, mimetype, buffer, size } = req.file;

      // Validate file type
      if (!ALLOWED_TYPES.includes(mimetype)) {
        throw new HttpError(400, 'BAD_REQUEST', 'Unsupported file type. Supported: PDF, DOCX, TXT');
      }

      const checksum = crypto.createHash('md5').update(buffer).digest('hex');
      const ext = path.extname(originalname);
      const storageKey = `organizations/${req.user!.organizationId}/documents/${crypto.randomUUID()}${ext}`;

      // Upload to MinIO
      await storageService.uploadFile(buffer, storageKey, mimetype);

      // Create Document record
      const document = await prisma.document.create({
        data: {
          organizationId: req.user!.organizationId,
          uploadedById: req.user!.id,
          title: path.parse(originalname).name, // Use filename without extension as title
          originalName: originalname,
          mimeType: mimetype,
          fileSize: size,
          storageKey,
          checksum,
          status: 'UPLOADED',
        },
      });

      // Enqueue ingestion job for async processing
      await ingestionQueue.add('process-document', { documentId: document.id });

      // Create ingestion job record
      await prisma.ingestionJob.create({
        data: {
          documentId: document.id,
          status: 'PENDING',
        },
      });

      res.status(202).json({
        status: 'success',
        data: {
          id: document.id,
          title: document.title,
          originalName: document.originalName,
          status: document.status,
          message: 'Document uploaded and queued for processing',
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/documents
 * List all documents for the authenticated user's organization.
 */
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.document.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        indexedAt: true,
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    res.json({ status: 'success', data: docs });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/documents/:id
 * Get a single document by ID (org-scoped).
 */
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user!.organizationId,
      },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        ingestionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!doc) {
      throw new HttpError(404, 'NOT_FOUND', 'Document not found');
    }

    res.json({ status: 'success', data: doc });
  } catch (e) {
    next(e);
  }
});

export { router as documentsRoutes };
