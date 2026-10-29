// Server: Configuration

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname isn't available in ES modules — reconstruct it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  
  // Password hashing
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('12'),
  
  // Storage (S3/MinIO)
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string().default('documents'),
  S3_REGION: z.string().default('us-east-1'),
  
  // AI Provider
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: z.string().transform(Number).default('1536'),
  
  // App settings
  MAX_FILE_SIZE: z.string().transform(Number).default('52428800'), // 50MB
  CHUNK_SIZE_TOKENS: z.string().transform(Number).default('600'),
  CHUNK_OVERLAP_TOKENS: z.string().transform(Number).default('100'),
  TOP_K_RESULTS: z.string().transform(Number).default('5'),
  MIN_SIMILARITY_THRESHOLD: z.string().transform(Number).default('0.75'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = {
  ...parsed.data,
  port: parsed.data.PORT,
  nodeEnv: parsed.data.NODE_ENV,
  corsOrigins: parsed.data.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-domain.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  version: '1.0.0',
} as const;

export type Config = typeof config;
