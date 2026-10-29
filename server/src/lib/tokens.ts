// Server: JWT token signing and verification

import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface AccessTokenPayload {
  userId: string;
  organizationId: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): AccessTokenPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as AccessTokenPayload;
  } catch (err) {
    return null;
  }
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN as string,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
};
