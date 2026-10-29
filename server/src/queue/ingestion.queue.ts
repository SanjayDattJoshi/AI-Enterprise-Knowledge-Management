// Server: BullMQ ingestion queue and worker

import { Queue, Worker, Job } from 'bullmq';
import { redis } from '../config/redis.js';
import { prisma } from '../lib/prisma.js';
import { storageService } from '../storage/minio.client.js';
import { getEmbeddingClient } from '../ai/embedding.client.js';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import PDFParser from 'pdf-parse';
import mammoth from 'mammoth';

export const ingestionQueue = new Queue('ingestion', { connection: redis });

ingestionQueue.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err }, 'Ingestion queue error');
  }
});

/**
 * Naive text chunker that splits by paragraphs.
 * For production, integrate the token-based chunker from chunker.ts.
 */
const chunkText = (text: string): { content: string; page: number }[] => {
  const lines = text.split(/\n\n+/).filter((line) => line.trim().length > 0);
  return lines.map((line, i) => ({ content: line.trim(), page: 1 }));
};

/**
 * Extract text from different file types.
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
 * Start the BullMQ worker that processes document ingestion jobs.
 * Pipeline: Download → Extract text → Chunk → Embed → Store vectors
 */
export const startIngestionWorker = () => {
  const worker = new Worker(
    'ingestion',
    async (job: Job) => {
      const { documentId } = job.data;
      logger.info({ documentId, jobId: job.id }, 'Starting ingestion job');

      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document) throw new Error(`Document ${documentId} not found`);

      try {
        // Update status to PROCESSING
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'PROCESSING' },
        });

        // 1. Download from MinIO
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

        // 5. Persist Chunks + Vectors (raw SQL for pgvector)
        for (let i = 0; i < rawChunks.length; i++) {
          const vectorStr = `[${vectors[i].join(',')}]`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", "tokenCount", embedding, "createdAt")
             VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())`,
            document.id,
            contents[i],
            i,
            Math.ceil(contents[i].length / 4), // Rough token estimate
            vectorStr
          );
        }

        // Mark as INDEXED
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'INDEXED', indexedAt: new Date() },
        });

        logger.info({ documentId, chunkCount: rawChunks.length }, 'Ingestion complete');
      } catch (err: any) {
        logger.error({ err, documentId }, 'Ingestion failed');
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'FAILED' },
        });
        throw err; // Triggers BullMQ retry
      }
    },
    { connection: redis }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err: err?.message }, 'Ingestion job failed');
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Ingestion job completed');
  });

  logger.info('Ingestion worker started');
};
