-- Enable the pgvector extension so Prisma's Unsupported("vector(...)") columns work
   CREATE EXTENSION IF NOT EXISTS vector;