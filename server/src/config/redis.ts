// Server: Redis connection singleton using ioredis

import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from './logger.js';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  lazyConnect: process.env.NODE_ENV === 'test',
  retryStrategy: process.env.NODE_ENV === 'test' ? () => null : (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err }, 'Redis connection error');
  }
});
