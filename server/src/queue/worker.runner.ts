// Server: Dedicated Background Ingestion Worker Process

import { startIngestionWorker } from './ingestion.queue.js';
import { storageService } from '../storage/minio.client.js';
import { logger } from '../config/logger.js';

async function startWorker() {
  try {
    logger.info('Initializing background worker process...');

    // Ensure storage bucket is ready
    await storageService.createBucketIfNotExists();

    // Start BullMQ worker loop
    startIngestionWorker();

    logger.info('Background worker is active and awaiting jobs.');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down worker gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down worker gracefully...');
      process.exit(0);
    });
  } catch (err) {
    logger.error({ err }, 'Fatal error starting ingestion worker process');
    process.exit(1);
  }
}

startWorker();
