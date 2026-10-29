// Server: Embedding client with mock and factory

import { EmbeddingProvider } from './ai.types.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Mock embedding provider for local development without API costs.
 * Returns deterministic dummy vectors based on string content.
 * NOT semantically meaningful — used only for proving the pipeline works structurally.
 */
class MockEmbedding implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> {
    const size = config.EMBEDDING_DIMENSIONS;
    const vector = new Array(size).fill(0);
    const score = text.length % 10 || 1;
    for (let i = 0; i < size; i++) {
      vector[i] = (Math.sin(i * score) + 1) / 2;
    }
    return vector;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

/**
 * Factory function to get the appropriate embedding client.
 * Set AI_PROVIDER env var to switch between mock and real providers.
 */
export const getEmbeddingClient = (): EmbeddingProvider => {
  // For now, always use mock. OpenAI integration will be added in a later phase.
  logger.debug('Using MockEmbedding provider');
  return new MockEmbedding();
};
