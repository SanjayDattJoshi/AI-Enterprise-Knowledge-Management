// Server: Node.js native async ingestion queue and processor (No Redis/BullMQ required)

import { EventEmitter } from 'events';
import { prisma } from '../lib/prisma.js';
import { storageService } from '../storage/minio.client.js';
import { getEmbeddingClient } from '../ai/embedding.client.js';
import { logger } from '../config/logger.js';
import PDFParser from 'pdf-parse';
import mammoth from 'mammoth';

const queueEmitter = new EventEmitter();

/**
 * Text chunker that splits content into paragraphs.
 */
const chunkText = (text: string): { content: string; page: number }[] => {
  const lines = text.split(/\n\n+/).filter((line) => line.trim().length > 0);
  return lines.map((line) => ({ content: line.trim(), page: 1 }));
};

/**
 * Extract text from supported file types (PDF, DOCX, TXT).
 */
const extractText = async (buffer: Buffer, mimetype: string): Promise<string> => {
  if (mimetype === 'application/pdf') {
    const data = await PDFParser(buffer);
    return data.text;
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (mimetype === 'text/plain') {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file type: ${mimetype}`);
};

/**
 * Process a single document ingestion:
 * 1. Read file from local storage
 * 2. Extract text
 * 3. Chunk
 * 4. Generate embeddings via AI provider
 * 5. Persist chunks + vector embeddings to PostgreSQL pgvector
 */
export async function processDocument(documentId: string): Promise<void> {
  logger.info({ documentId }, 'Starting document ingestion');

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) throw new Error(`Document ${documentId} not found`);

  try {
    // Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    await prisma.ingestionJob.updateMany({
      where: { documentId, status: 'PENDING' },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    // 1. Read file stream from storage
    const stream = await storageService.getFile(document.storageKey);
    const bufferChunks: Buffer[] = [];
    for await (const chunk of stream) {
      bufferChunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(bufferChunks);

    // 2. Extract Text
    const text = await extractText(buffer, document.mimeType);
    if (!text || text.trim().length < 10) {
      throw new Error('Document appears empty or unreadable');
    }

    // 3. Chunking
    const rawChunks = chunkText(text);
    const contents = rawChunks.map((c) => c.content);
    logger.info({ documentId, chunkCount: contents.length }, 'Document chunked');

    // 4. Embedding (process in batches of 10)
    const embeddingClient = getEmbeddingClient();
    const vectors: number[][] = [];
    for (let i = 0; i < contents.length; i += 10) {
      const batch = contents.slice(i, i + 10);
      const batchVecs = await embeddingClient.embedBatch(batch);
      vectors.push(...batchVecs);
    }

    // 5. Persist Chunks + Vectors into PostgreSQL (pgvector)
    for (let i = 0; i < rawChunks.length; i++) {
      const vectorStr = `[${vectors[i].join(',')}]`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", "tokenCount", embedding, "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())`,
        document.id,
        contents[i],
        i,
        Math.ceil(contents[i].length / 4),
        vectorStr
      );
    }

    // Mark document as INDEXED
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'INDEXED', indexedAt: new Date() },
    });

    await prisma.ingestionJob.updateMany({
      where: { documentId, status: 'PROCESSING' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    logger.info({ documentId, chunkCount: rawChunks.length }, 'Document ingestion complete');
    queueEmitter.emit('completed', { id: `doc-${documentId}`, data: { documentId } });
  } catch (err: any) {
    logger.error({ err, documentId }, 'Document ingestion failed');

    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'FAILED' },
    });

    await prisma.ingestionJob.updateMany({
      where: { documentId, status: 'PROCESSING' },
      data: { status: 'FAILED', errorMessage: err?.message },
    });

    queueEmitter.emit('failed', { id: `doc-${documentId}` }, err);
    throw err;
  }
}

/**
 * Native Node.js in-memory async queue adapter matching the BullMQ interface.
 */
export const ingestionQueue = {
  async add(name: string, data: { documentId: string }) {
    setImmediate(async () => {
      try {
        await processDocument(data.documentId);
      } catch (err) {
        // Error already logged and emitted in processDocument
      }
    });
    return { id: `job-${Date.now()}` };
  },

  on(event: string, handler: (...args: any[]) => void) {
    queueEmitter.on(event, handler);
  },
};

/**
 * Start the ingestion worker.
 * Checks for any pending ingestion jobs in PostgreSQL and processes them.
 */
export const startIngestionWorker = () => {
  logger.info('Node.js native async ingestion worker initialized (PostgreSQL + in-memory)');

  // Recover and process any pending jobs left over in PostgreSQL
  setImmediate(async () => {
    try {
      const pendingJobs = await prisma.ingestionJob.findMany({
        where: { status: 'PENDING' },
        take: 10,
      });

      for (const job of pendingJobs) {
        logger.info({ documentId: job.documentId }, 'Resuming pending ingestion job');
        await processDocument(job.documentId);
      }
    } catch (err) {
      logger.error({ err }, 'Error checking pending ingestion jobs');
    }
  });
};
