// Server: Request logging middleware
import { logger } from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};
