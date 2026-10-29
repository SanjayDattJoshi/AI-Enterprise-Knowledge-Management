// Server: Conversations routes — list, detail, delete

import { Router, Response, NextFunction } from 'express';
import { protect, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

const router = Router();

/**
 * GET /api/conversations
 * List all conversations for the authenticated user (org-scoped).
 */
router.get('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // First message for preview
          select: { content: true, role: true },
        },
      },
    });

    res.json({ status: 'success', data: conversations });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/conversations/:id
 * Get a specific conversation with all messages.
 */
router.get('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
        organizationId: req.user!.organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new HttpError(404, 'NOT_FOUND', 'Conversation not found');
    }

    res.json({ status: 'success', data: conversation });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation and all its messages (cascade).
 */
router.delete('/:id', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const exists = await prisma.conversation.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!exists) {
      throw new HttpError(404, 'NOT_FOUND', 'Conversation not found');
    }

    await prisma.conversation.delete({ where: { id: req.params.id } });

    res.json({ status: 'success', data: {} });
  } catch (e) {
    next(e);
  }
});

export { router as conversationsRoutes };
