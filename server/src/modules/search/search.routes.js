// Server: Search routes
import { Router } from 'express';
import { protect } from '../../middleware/auth.js';
import { ragService } from '../../ai/rag.service.js';
import { db } from '../../db/index.js';
import { z } from 'zod';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters').max(500, 'Query too long'),
  conversationId: z.string().optional().nullable(),
});

router.post('/', protect, async (req, res, next) => {
  try {
    const { query, conversationId } = searchSchema.parse(req.body);
    const startTime = Date.now();

    // 1. Retrieve relevant knowledge chunks
    const chunks = await ragService.search(query, req.user.organizationId);

    let answerContent = "I couldn't find enough information in the organization knowledge base to answer this question.";
    let sources = [];

    // 2. Load context history if conversationId provided
    let historyText = '';
    if (conversationId) {
      const recent = await db.messages.findRecentInConversation(conversationId, 5);
      historyText = recent.map((m) => `${m.role}: ${m.content}`).join('\n');
    }

    // 3. Generate answer
    if (chunks.length > 0) {
      answerContent = await ragService.generateAnswer(query, chunks, historyText);

      sources = chunks.map((c, i) => ({
        chunkId: c.chunkId,
        label: `[${i + 1}]`,
        title: c.documentTitle,
        similarity: c.similarity,
        excerpt: c.content.length > 180 ? c.content.substring(0, 180) + '...' : c.content,
      }));
    }

    const latencyMs = Date.now() - startTime;

    // 4. Manage conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await db.conversations.create({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        title: query.length > 45 ? query.substring(0, 45) + '...' : query,
      });
      convId = conv.id;
    }

    // Save user query message
    await db.messages.create({
      conversationId: convId,
      role: 'USER',
      content: query,
    });

    // Save assistant response message
    const assistantMsg = await db.messages.create({
      conversationId: convId,
      role: 'ASSISTANT',
      content: answerContent,
    });

    // Save citation sources
    if (sources.length > 0) {
      await db.messages.addSources(
        assistantMsg.id,
        sources.map((s) => ({ chunkId: s.chunkId, citationLabel: s.label }))
      );
    }

    // Record search metric
    await db.searchQueries.create({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      conversationId: convId,
      queryText: query,
      latencyMs,
    });

    res.json({
      status: 'success',
      data: {
        messageId: assistantMsg.id,
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
