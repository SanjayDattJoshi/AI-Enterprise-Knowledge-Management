// Server: LLM client with mock and factory

import { LLMProvider } from './ai.types.js';
import { logger } from '../config/logger.js';

/**
 * Mock LLM provider for local development without API costs.
 * Simulates a grounded answer generation by detecting context in the prompt.
 */
class MockLLM implements LLMProvider {
  async generate(prompt: string): Promise<string> {
    logger.debug('MockLLM generating response...');

    // Basic simulation of grounded answer
    if (prompt.toLowerCase().includes('context:') || prompt.toLowerCase().includes('context\n')) {
      return `Based on the provided context, the answer is: "Mock Answer derived from the retrieved document chunks." [1]`;
    }
    return 'I cannot answer this question without sufficient context from the knowledge base.';
  }
}

/**
 * Factory function to get the appropriate LLM client.
 * Set AI_PROVIDER env var to switch between mock and real providers.
 */
export const getLLMClient = (): LLMProvider => {
  logger.debug('Using MockLLM provider');
  return new MockLLM();
};
