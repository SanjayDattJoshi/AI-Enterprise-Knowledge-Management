// Unit tests for text chunker

import { describe, it, expect } from 'vitest';
import { chunkText } from './chunker.js';

describe('Chunker Utility', () => {
  it('splits long text into overlapping chunks correctly', () => {
    const text = 'The quick brown fox jumps over the lazy dog. Enterprise search RAG system with pgvector.';
    const chunkSize = 30;
    const overlap = 10;

    const chunks = chunkText(text, chunkSize, overlap);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(chunkSize);
    });
  });

  it('handles empty or blank text gracefully', () => {
    expect(chunkText('', 50, 10)).toEqual([]);
    expect(chunkText('   \n  \t ', 50, 10)).toEqual([]);
  });

  it('throws error when invalid chunk size or overlap is provided', () => {
    expect(() => chunkText('Sample text', 0, 0)).toThrow();
    expect(() => chunkText('Sample text', 50, 50)).toThrow();
    expect(() => chunkText('Sample text', 50, 60)).toThrow();
  });
});
