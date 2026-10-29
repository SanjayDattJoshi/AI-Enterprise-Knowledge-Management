// Server: Text chunking utility for document ingestion

/**
 * Naive text chunker that splits content into overlapping chunks.
 * In production, use a proper tokenizer (e.g., tiktoken for GPT models).
 *
 * @param text - The full document text to chunk
 * @param size - Target chunk size in characters
 * @param overlap - Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
export const chunkText = (text: string, size: number, overlap: number): string[] => {
  if (!text || text.trim().length === 0) return [];
  if (size <= 0) throw new Error('Chunk size must be positive');
  if (overlap >= size) throw new Error('Overlap must be less than chunk size');

  const chunks: string[] = [];
  const step = size - overlap;

  for (let i = 0; i < text.length; i += step) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    // Stop if we've reached the end
    if (i + size >= text.length) break;
  }

  return chunks;
};
