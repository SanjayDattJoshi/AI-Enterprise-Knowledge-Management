// Server: AI provider type interfaces

export interface LLMProvider {
  generate(prompt: string): Promise<string>;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface AIConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}
