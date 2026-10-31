// Server: RAG (Retrieval-Augmented Generation) service
import { db } from '../db/index.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import OpenAI from 'openai';

let openaiClient = null;
if (config.OPENAI_API_KEY && !config.OPENAI_API_KEY.includes('your-api-key') && config.OPENAI_API_KEY.startsWith('sk-')) {
  try {
    openaiClient = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  } catch (err) {
    logger.warn('OpenAI client initialization skipped:', err.message);
  }
}

export const ragService = {
  /**
   * Search relevant chunks from indexed documents
   */
  async search(query, organizationId) {
    const results = await db.chunks.search(query, organizationId, config.TOP_K_RESULTS || 5);
    logger.debug(`Found ${results.length} chunks for query: "${query}"`);
    return results;
  },

  /**
   * Generate an answer based on context chunks
   */
  async generateAnswer(query, context, conversationHistory = '') {
    if (!context || context.length === 0) {
      return "I couldn't find enough information in the organization knowledge base to answer this question. Please make sure the relevant documents are uploaded and indexed.";
    }

    const contextText = context
      .map((c, i) => `[${i + 1}] Document: "${c.documentTitle}" (Page ${c.pageNumber || 1})\nContent: ${c.content}`)
      .join('\n\n');

    // Attempt OpenAI call if available
    if (openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: config.OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content: `You are an accurate enterprise AI knowledge assistant.
Answer the user's question using ONLY the provided Context below.
Cite your sources with citation numbers like [1], [2] at the end of statements where appropriate.
If the information is not contained in the context, clearly say so.
Do not invent facts.`,
            },
            {
              role: 'user',
              content: `Context:\n${contextText}\n\nPrevious conversation:\n${conversationHistory}\n\nQuestion: ${query}`,
            },
          ],
        });

        const reply = response.choices[0]?.message?.content;
        if (reply) return reply;
      } catch (err) {
        logger.warn(`OpenAI generation fallback due to: ${err.message}`);
      }
    }

    // High quality local RAG synthesis
    const primaryChunk = context[0];
    const secondaryChunk = context[1];

    let answer = `Based on enterprise documentation from **${primaryChunk.documentTitle}**:\n\n${primaryChunk.content} [1]`;

    if (secondaryChunk && secondaryChunk.documentTitle !== primaryChunk.documentTitle) {
      answer += `\n\nAdditionally, according to **${secondaryChunk.documentTitle}**:\n${secondaryChunk.content} [2]`;
    }

    return answer;
  },
};
