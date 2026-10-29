// Server: Search routes — orchestrate retrieval, generation, and persistence

import { Router, Response, NextFunction } from 'express';
import { protect, AuthRequest } from '../../middleware/auth.js';
import { ragService } from '../../ai/rag.service.js';
import { prisma } from '../../lib/prisma.js';
import { z } from 'zod';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(3, 'Query must be at least 3 characters').max(500, 'Query too long'),
  conversationId: z.string().uuid().optional(),
});

/**
 * POST /api/search
 * Full RAG pipeline: Retrieve → Generate → Persist
 */
router.post('/', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, conversationId } = searchSchema.parse(req.body);
    const startTime = Date.now();

    // 1. Retrieve relevant chunks
    const chunks = await ragService.search(query, req.user!.organizationId);

    let answerContent = "I couldn't find enough information in the knowledge base to answer this question.";
    let sources: { chunkId: string; label: string; title: string; excerpt: string }[] = [];

    // 2. Generate answer (only if we found context)
    if (chunks.length > 0) {
      // Load recent conversation history for context (max 5 messages)
      let history = '';
      if (conversationId) {
        const msgs = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        history = msgs
          .reverse()
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n');
      }

      answerContent = await ragService.generateAnswer(query, chunks, history);

      // Map sources for the response
      sources = chunks.map((c, i) => ({
        chunkId: c.chunkId,
        label: `[${i + 1}]`,
        title: c.documentTitle,
        excerpt: c.content.substring(0, 150) + (c.content.length > 150 ? '...' : ''),
      }));
    }

    // 3. Persist the interaction
    const latencyMs = Date.now() - startTime;

    // Ensure conversation exists or create a new one
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          organizationId: req.user!.organizationId,
          userId: req.user!.id,
          title: query.substring(0, 50),
        },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.message.create({
      data: { conversationId: convId, role: 'USER', content: query },
    });

    // Save assistant message
    const message = await prisma.message.create({
      data: { conversationId: convId, role: 'ASSISTANT', content: answerContent },
    });

    // Link answer sources (citations)
    if (chunks.length > 0) {
      await prisma.answerSource.createMany({
        data: chunks.map((c, i) => ({
          messageId: message.id,
          chunkId: c.chunkId,
          citationLabel: `[${i + 1}]`,
        })),
      });
    }

    // Save search metrics
    await prisma.searchQuery.create({
      data: {
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        conversationId: convId,
        queryText: query,
        latencyMs,
      },
    });

    // 4. Respond
    res.json({
      status: 'success',
      data: {
        messageId: message.id,
        conversationId: convId,
        answer: answerContent,
        sources,
        latencyMs,
      },
    });
  } catch (e) {
    next(e);
  }
});

export { router as searchRoutes };
