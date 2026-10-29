// Server: Admin routes — dashboard stats, document management

import { Router, Response, NextFunction } from 'express';
import { protect, restrictTo, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { storageService } from '../../storage/minio.client.js';

const router = Router();

// All admin routes require ADMIN role
router.use(protect, restrictTo('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Aggregate stats for the organization.
 */
router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId;

    const [userCount, documentCount, searchCount, storageSize] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId } }),
      prisma.document.count({ where: { organizationId: orgId } }),
      prisma.searchQuery.count({ where: { organizationId: orgId } }),
      prisma.document.aggregate({
        where: { organizationId: orgId },
        _sum: { fileSize: true },
      }),
    ]);

    // Recent searches (last 5)
    const recentSearches = await prisma.searchQuery.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({
      status: 'success',
      data: {
        stats: {
          userCount,
          documentCount,
          searchCount,
          totalStorageKB: storageSize._sum.fileSize || 0,
        },
        recentSearches,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/documents
 * List all documents with uploader info.
 */
router.get('/documents', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const docs = await prisma.document.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
    });

    res.json({ status: 'success', data: docs });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Delete a document, its chunks, and optionally the storage file.
 */
router.delete('/documents/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
    });

    if (!doc) {
      throw new HttpError(404, 'NOT_FOUND', 'Document not found');
    }

    // Delete chunks and document in a transaction
    await prisma.$transaction([
      prisma.documentChunk.deleteMany({ where: { documentId: doc.id } }),
      prisma.ingestionJob.deleteMany({ where: { documentId: doc.id } }),
      prisma.document.delete({ where: { id: doc.id } }),
    ]);

    // Clean up storage (best effort)
    try {
      await storageService.deleteFile(doc.storageKey);
    } catch (err) {
      // Log but don't fail the request if storage cleanup fails
    }

    res.json({ status: 'success', data: {} });
  } catch (e) {
    next(e);
  }
});

export { router as adminRoutes };
