// Server: Admin routes
import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { storageService } from '../../storage/storage.service.js';

const router = Router();

router.use(protect, restrictTo('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Aggregated stats for the admin dashboard
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;

    const [userCount, docStats, searchCount, recentSearches] = await Promise.all([
      db.users.countByOrg(orgId),
      db.documents.countByOrg(orgId),
      db.searchQueries.countByOrg(orgId),
      db.searchQueries.getRecentByOrg(orgId, 5),
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          userCount,
          documentCount: docStats.count,
          searchCount,
          totalStorageKB: Math.round(docStats.totalBytes / 1024),
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
 * List all documents
 */
router.get('/documents', async (req, res, next) => {
  try {
    const docs = await db.documents.findByOrg(req.user.organizationId);
    res.json({ status: 'success', data: docs });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Delete document and chunks
 */
router.delete('/documents/:id', async (req, res, next) => {
  try {
    const doc = await db.documents.findById(req.params.id, req.user.organizationId);
    if (!doc) {
      throw new HttpError(404, 'NOT_FOUND', 'Document not found');
    }

    await db.documents.delete(req.params.id, req.user.organizationId);

    if (doc.storage_key || doc.storageKey) {
      await storageService.deleteFile(doc.storage_key || doc.storageKey);
    }

    res.json({ status: 'success', data: {} });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/admin/users
 * List all users in organization
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await db.users.findByOrg(req.user.organizationId);
    res.json({ status: 'success', data: users });
  } catch (e) {
    next(e);
  }
});

export { router as adminRoutes };
