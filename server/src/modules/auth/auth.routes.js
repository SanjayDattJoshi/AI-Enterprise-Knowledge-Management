// Server: Authentication routes
import { Router } from 'express';
import { authService } from './auth.service.js';
import { protect } from '../../middleware/auth.js';
import { db } from '../../db/index.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
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

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const data = refreshSchema.parse(req.body);
    const result = await authService.refresh(data.refreshToken);
    res.json({ status: 'success', data: result });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', protect, async (req, res, next) => {
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

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await db.users.findById(req.user.id);
    res.json({
      status: 'success',
      data: {
        id: user.id,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id || user.organizationId,
        isActive: user.is_active ?? user.isActive,
        createdAt: user.created_at || user.createdAt,
        organization: user.organization,
      },
    });
  } catch (e) {
    next(e);
  }
});

export { router as authRoutes };
