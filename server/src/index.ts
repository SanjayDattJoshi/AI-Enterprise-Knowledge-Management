// Server: Main Entry Point

import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { startIngestionWorker } from './queue/ingestion.queue.js';
import { storageService } from './storage/minio.client.js';

// Boot sequence: initialize infrastructure, then start server
async function boot() {
  try {
    // Initialize storage bucket
    await storageService.createBucketIfNotExists();
    logger.info('Storage initialized');

    // Start background workers
    startIngestionWorker();
    logger.info('Background workers started');

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error({ err }, 'Failed to boot server');
    process.exit(1);
  }
}

boot();

export { app };
