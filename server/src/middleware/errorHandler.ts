// Server: Error handling middleware

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../config/logger.js';

export interface AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;
}

export class HttpError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'HttpError';
  }
}

// Predefined error types
export const Errors = {
  BAD_REQUEST: (message = 'Invalid request', details?: Record<string, unknown>) =>
    new HttpError(400, 'BAD_REQUEST', message, details),

  UNAUTHORIZED: (message = 'Authentication required') =>
    new HttpError(401, 'UNAUTHORIZED', message),

  FORBIDDEN: (message = 'Access denied') =>
    new HttpError(403, 'FORBIDDEN', message),

  NOT_FOUND: (resource = 'Resource') =>
    new HttpError(404, 'NOT_FOUND', `${resource} not found`),

  CONFLICT: (message = 'Resource already exists') =>
    new HttpError(409, 'CONFLICT', message),

  RATE_LIMIT: (message = 'Too many requests, please try again later') =>
    new HttpError(429, 'RATE_LIMIT_EXCEEDED', message),

  INTERNAL: (message = 'An unexpected error occurred') =>
    new HttpError(500, 'INTERNAL_ERROR', message),
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = err?.message || 'An unexpected error occurred';
  let details: any = undefined;

  // Custom HttpError
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    code = err.code || 'HTTP_ERROR';
    details = err.details;
  }
  // Zod validation errors -> 400 Bad Request
  else if (err instanceof ZodError || err?.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request input';
    details = err.errors;
  }
  // Prisma unique constraint violation -> 409 Conflict
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      message = 'A record with this information already exists.';
    }
  }
  // JWT errors -> 401 Unauthorized
  else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_UNAUTHORIZED';
    message = 'Invalid or expired token.';
  }

  // Log error details (skip info logs in tests)
  if (process.env.NODE_ENV !== 'test' || statusCode === 500) {
    logger.error({
      error: {
        code,
        message: err.message,
        stack: err.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        userId: (req as any).user?.id,
        organizationId: (req as any).user?.organizationId,
      },
    });
  }

  // Hide internal messages in production for 500s
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    status: 'error',
    code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
