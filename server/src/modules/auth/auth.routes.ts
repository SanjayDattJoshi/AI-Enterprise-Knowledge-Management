// Server: Authentication routes

import { Router, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { protect, AuthRequest } from '../../middleware/auth.js';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// --- Validation Schemas ---

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// --- Routes ---

/**
 * POST /api/auth/register
 * Register a new organization and admin user
 */
router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(
      data.organizationName,
      data.firstName,
      data.lastName,
      data.email,
      data.password
    );
    res.status(201).json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/login
 * Authenticate and receive tokens
 */
router.post('/login', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/refresh
 * Rotate refresh token and get new access token
 */
router.post('/refresh', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = refreshSchema.parse(req.body);
    const result = await authService.refresh(data.refreshToken);
    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/logout
 * Revoke refresh token (protected)
 */
router.post('/logout', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && req.user) {
      await authService.logout(req.user.id, refreshToken);
    }
    res.json({ status: 'success', data: {} });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        organizationId: true,
        isActive: true,
        createdAt: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
    res.json({ status: 'success', data: user });
  } catch (e) {
    next(e);
  }
});

export { router as authRoutes };
