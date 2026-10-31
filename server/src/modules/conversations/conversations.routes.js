// Server: Conversations routes
import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { HttpError } from '../../middleware/errorHandler.js';

const router = Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const list = await db.conversations.findByOrgAndUser(
      req.user.organizationId,
      req.user.id
    );
    res.json({ status: 'success', data: list });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const item = await db.conversations.findById(
      req.params.id,
      req.user.organizationId,
      req.user.id
    );
    if (!item) {
      throw new HttpError(404, 'NOT_FOUND', 'Conversation not found');
    }
    res.json({ status: 'success', data: item });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await db.conversations.delete(req.params.id);
    res.json({ status: 'success', data: {} });
  } catch (e) {
    next(e);
  }
});

export { router as conversationsRoutes };
