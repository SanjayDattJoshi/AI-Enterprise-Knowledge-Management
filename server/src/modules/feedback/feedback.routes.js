// Server: Feedback routes
import { Router } from 'express';
import { protect, restrictTo } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { z } from 'zod';

const router = Router();

const feedbackSchema = z.object({
  rating: z.enum(['HELPFUL', 'NOT_HELPFUL']),
  comment: z.string().optional(),
});

router.post('/:messageId', protect, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const data = feedbackSchema.parse(req.body);

    const feedback = await db.feedback.create({
      userId: req.user.id,
      messageId,
      rating: data.rating,
      comment: data.comment || '',
    });

    res.status(201).json({ status: 'success', data: feedback });
  } catch (e) {
    next(e);
  }
});

router.get('/admin', protect, restrictTo('ADMIN'), async (req, res, next) => {
  try {
    const list = await db.feedback.findByOrg(req.user.organizationId, 50);
    res.json({ status: 'success', data: list });
  } catch (e) {
    next(e);
  }
});

export { router as feedbackRoutes };
