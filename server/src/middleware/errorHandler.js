// Server: Error handling middleware
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'HttpError';
  }
}

export const errorHandler = (err, req, res, _next) => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = err?.message || 'An unexpected error occurred';
  let details = undefined;

  if (err && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    code = err.code || 'HTTP_ERROR';
    details = err.details;
  } else if (err instanceof ZodError || err?.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request input';
    details = err.errors;
  } else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'AUTH_UNAUTHORIZED';
    message = 'Invalid or expired token.';
  }

  if (statusCode === 500) {
    logger.error(`[${req.method} ${req.url}] ${err?.stack || err}`);
  }

  res.status(statusCode).json({
    status: 'error',
    code,
    message,
    ...(details && { details }),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
};
