// Server: Request logging middleware

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      type: 'request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id,
      organizationId: (req as any).user?.organizationId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};
