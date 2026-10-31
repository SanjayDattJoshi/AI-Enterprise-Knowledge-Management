// Server: JWT token signing and verification
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const signAccessToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

export const signRefreshToken = (userId) => {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN,
  });
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    return null;
  }
};
