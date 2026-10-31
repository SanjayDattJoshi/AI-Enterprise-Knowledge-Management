// Server: Document management routes
import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import { db } from '../../db/index.js';
import { protect, restrictTo } from '../../middleware/auth.js';
import { storageService } from '../../storage/storage.service.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_FILE_SIZE || 50 * 1024 * 1024 },
});

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Text extractor for PDF, DOCX, TXT
 */
async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(buffer);
      return data.text || '';
    } catch (err) {
      logger.warn(`pdf-parse warning: ${err.message}`);
      return buffer.toString('utf-8');
    }
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (err) {
      logger.warn(`mammoth extraction warning: ${err.message}`);
      return buffer.toString('utf-8');
    }
  }
  return buffer.toString('utf-8');
}

/**
 * Split text into semantic chunks (paragraphs)
 */
function chunkText(text) {
  const parts = text.split(/\n\s*\n+/).filter((t) => t.trim().length > 15);
  if (parts.length === 0 && text.trim().length > 0) {
    return [{ content: text.trim(), page: 1 }];
  }
  return parts.map((content, idx) => ({
    content: content.trim(),
    page: Math.floor(idx / 4) + 1,
  }));
}

/**
 * POST /api/documents
 * Upload and automatically index a document
 */
router.post(
  '/',
  protect,
  restrictTo('ADMIN'),
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new HttpError(400, 'BAD_REQUEST', 'No file uploaded');
      }

      const { originalname, mimetype, buffer, size } = req.file;

      if (!ALLOWED_TYPES.includes(mimetype)) {
        throw new HttpError(400, 'BAD_REQUEST', 'Unsupported file type. Supported: PDF, DOCX, TXT');
      }

      const checksum = crypto.createHash('md5').update(buffer).digest('hex');
      const ext = path.extname(originalname);
      const storageKey = `organizations/${req.user.organizationId}/documents/${crypto.randomUUID()}${ext}`;

      // Save to local storage
      await storageService.uploadFile(buffer, storageKey, mimetype);

      // Create Document record
      const document = await db.documents.create({
        organizationId: req.user.organizationId,
        uploadedById: req.user.id,
        title: path.parse(originalname).name,
        originalName: originalname,
        mimeType: mimetype,
        fileSize: size,
        storageKey,
        checksum,
        status: 'PROCESSING',
      });

      // Extract text & chunk in background or synchronously
      setImmediate(async () => {
        try {
          const rawText = await extractText(buffer, mimetype);
          const rawChunks = chunkText(rawText);

          const chunksToInsert = rawChunks.map((c, i) => ({
            documentId: document.id,
            chunkIndex: i,
            content: c.content,
            tokenCount: Math.ceil(c.content.length / 4),
            pageNumber: c.page,
          }));

          if (chunksToInsert.length > 0) {
            await db.chunks.createMany(chunksToInsert);
          }

          await db.documents.updateStatus(document.id, 'INDEXED', new Date());
          logger.info(`Indexed document "${document.title}" with ${chunksToInsert.length} chunks`);
        } catch (err) {
          logger.error(`Failed to index document ${document.id}: ${err.message}`);
          await db.documents.updateStatus(document.id, 'FAILED');
        }
      });

      res.status(202).json({
        status: 'success',
        data: {
          id: document.id,
          title: document.title,
          originalName: document.original_name || document.originalName,
          status: 'INDEXED',
          message: 'Document uploaded and indexed successfully',
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

/**
 * GET /api/documents
 * List all documents
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const docs = await db.documents.findByOrg(req.user.organizationId);
    res.json({ status: 'success', data: docs });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/documents/:id
 * Get single document
 */
router.get('/:id', protect, async (req, res, next) => {
  try {
    const doc = await db.documents.findById(req.params.id, req.user.organizationId);
    if (!doc) {
      throw new HttpError(404, 'NOT_FOUND', 'Document not found');
    }
    res.json({ status: 'success', data: doc });
  } catch (e) {
    next(e);
  }
});

export { router as documentsRoutes };
