// Server: Authentication & authorization middleware
import { verifyAccessToken } from '../lib/tokens.js';
import { db } from '../db/index.js';
import { HttpError } from './errorHandler.js';

export const protect = async (req, _res, next) => {
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

    const user = await db.users.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User not found or account disabled');
    }

    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export const restrictTo = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
};
