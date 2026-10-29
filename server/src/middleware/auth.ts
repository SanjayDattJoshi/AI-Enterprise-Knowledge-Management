// Server: Authentication & authorization middleware

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokens.js';
import { prisma } from '../lib/prisma.js';
import { HttpError } from './errorHandler.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: 'ADMIN' | 'EMPLOYEE';
  };
}

/**
 * Middleware: Validates Bearer token, checks user is active,
 * and attaches user context to the request.
 */
export const protect = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    // Fetch latest user state to ensure isActive is checked on every request
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User not found or account disabled');
    }

    req.user = {
      id: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware factory: Restricts access to specific roles.
 * Must be used after the `protect` middleware.
 */
export const restrictTo = (...roles: ('ADMIN' | 'EMPLOYEE')[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
};
