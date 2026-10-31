// Server: Main Entry Point
import { app } from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { initDb } from './db/index.js';
import { storageService } from './storage/storage.service.js';

async function boot() {
  try {
    // 1. Initialize local filesystem storage
    await storageService.createBucketIfNotExists();

    // 2. Initialize database (PostgreSQL with auto-seed and graceful fallback)
    await initDb();

    // 3. Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`🌐 Health check available at: http://localhost:${config.port}/health`);
      logger.info(`🔑 Default Admin: admin@enterprise.ai / password123`);
      logger.info(`🔑 Default Employee: employee@enterprise.ai / password123`);
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
    logger.error('Failed to boot server', err);
    process.exit(1);
  }
}

boot();

export { app };
