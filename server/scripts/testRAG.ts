// Server: End-to-end RAG proof of concept test script
// Usage: npx tsx server/scripts/testRAG.ts

import { prisma } from '../src/lib/prisma.js';
import { getEmbeddingClient } from '../src/ai/embedding.client.js';
import { getLLMClient } from '../src/ai/llm.client.js';
import { chunkText } from '../src/modules/ingestion/chunker.js';
import { logger } from '../src/config/logger.js';

async function run() {
  logger.info('--- Starting RAG Proof of Concept ---');

  // 1. Setup: Create Org, User, Document
  const org = await prisma.organization.create({
    data: { name: 'Test Org', slug: 'test-org-rag' },
  });

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      firstName: 'RAG',
      lastName: 'Tester',
      email: 'rag-test@test.com',
      passwordHash: 'test-hash-not-real',
      role: 'ADMIN',
    },
  });

  const doc = await prisma.document.create({
    data: {
      organizationId: org.id,
      uploadedById: user.id,
      title: 'Employee Handbook',
      originalName: 'handbook.txt',
      mimeType: 'text/plain',
      fileSize: 1024,
      storageKey: `test/rag-test/${Date.now()}/handbook.txt`,
      checksum: 'abc123test',
      status: 'PROCESSING',
    },
  });

  // 2. Ingestion: Simulate content, Chunk, Embed, Store
  const mockContent = `Welcome to the company. Our policy is strict on remote work. Employees must submit timesheets weekly. The headquarters is located in New York City. All employees receive 20 days of paid time off per year. The engineering team uses agile methodology with two-week sprints.`;

  const chunks = chunkText(mockContent, 80, 15);
  const embeddingClient = getEmbeddingClient();
  const vectors = await embeddingClient.embedBatch(chunks);

  logger.info(`Generated ${chunks.length} chunks and ${vectors.length} vectors.`);

  // Store chunks using raw SQL for pgvector compatibility
  for (let i = 0; i < chunks.length; i++) {
    const vectorStr = `[${vectors[i].join(',')}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "documentId", content, "chunkIndex", "tokenCount", embedding, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::vector, NOW())`,
      doc.id,
      chunks[i],
      i,
      Math.ceil(chunks[i].length / 4),
      vectorStr
    );
  }

  await prisma.document.update({ where: { id: doc.id }, data: { status: 'INDEXED' } });
  logger.info('Document indexed successfully.');

  // 3. Search: Embed Query, Vector Search
  const query = 'Where is the headquarters?';
  const queryVector = await embeddingClient.embed(query);
  const queryVectorStr = `[${queryVector.join(',')}]`;

  const results: any[] = await prisma.$queryRawUnsafe(
    `SELECT id, content, 1 - (embedding <=> $1::vector) as similarity
     FROM "DocumentChunk"
     WHERE "documentId" = $2
     ORDER BY embedding <=> $1::vector
     LIMIT 3`,
    queryVectorStr,
    doc.id
  );

  logger.info(`Search returned ${results.length} results.`);

  // 4. RAG: Construct Prompt, Call LLM
  const context = results.map((r: any) => r.content).join('\n');
  const prompt = `Answer based ONLY on this context:\nContext: ${context}\nQuestion: ${query}`;

  const llm = getLLMClient();
  const answer = await llm.generate(prompt);

  logger.info('--- RAG Result ---');
  logger.info(`Query: ${query}`);
  logger.info(`Context used: ${context}`);
  logger.info(`Answer: ${answer}`);
  logger.info('--- End RAG Result ---');

  // 5. Cleanup
  await prisma.documentChunk.deleteMany({ where: { documentId: doc.id } });
  await prisma.document.delete({ where: { id: doc.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.organization.delete({ where: { id: org.id } });

  logger.info('Cleanup complete. RAG proof successful!');
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('RAG test failed:', e);
  process.exit(1);
});
