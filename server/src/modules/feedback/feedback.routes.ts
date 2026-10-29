// Server: Feedback routes — submit and list (admin)

import { Router, Response, NextFunction } from 'express';
import { protect, restrictTo, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { z } from 'zod';

const router = Router();

const feedbackSchema = z.object({
  rating: z.enum(['HELPFUL', 'NOT_HELPFUL']),
  comment: z.string().optional(),
});

/**
 * POST /api/feedback/:messageId
 * Submit feedback on a specific message (answer).
 */
router.post('/:messageId', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const data = feedbackSchema.parse(req.body);

    // Verify message exists and belongs to user's org
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: { organizationId: req.user!.organizationId },
      },
    });

    if (!message) {
      throw new HttpError(404, 'NOT_FOUND', 'Message not found');
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId: req.user!.id,
        messageId,
        rating: data.rating,
        comment: data.comment,
      },
    });

    res.status(201).json({ status: 'success', data: feedback });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/feedback/admin
 * List all feedback for the organization (ADMIN only).
 */
router.get('/admin', protect, restrictTo('ADMIN'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      where: {
        message: {
          conversation: { organizationId: req.user!.organizationId },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true } },
        message: { select: { content: true } },
      },
    });

    res.json({ status: 'success', data: feedbacks });
  } catch (e) {
    next(e);
  }
});

export { router as feedbackRoutes };
