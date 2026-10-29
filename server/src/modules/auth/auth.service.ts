// Server: Authentication service — register, login, refresh, logout

import { prisma } from '../../lib/prisma.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const authService = {

  /**
   * Register a new organization and its first admin user.
   * Creates the org + user in a single transaction.
   */
  async register(organizationName: string, firstName: string, lastName: string, email: string, password: string) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new HttpError(409, 'CONFLICT', 'Email already registered');
    }

    const orgSlug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: organizationName, slug: orgSlug },
      });

      const user = await tx.user.create({
        data: {
          organizationId: org.id,
          firstName,
          lastName,
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN', // First user in an org is always admin
          isActive: true,
        },
      });

      return { org, user };
    });

    const accessToken = signAccessToken({
      userId: result.user.id,
      organizationId: result.org.id,
      role: result.user.role,
    });
    const refreshToken = signRefreshToken(result.user.id);

    // Store refresh token hash in DB
    await prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshToken, // In production, hash this with crypto.createHash('sha256')
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.user.role,
        organizationId: result.org.id,
      },
    };
  },

  /**
   * Authenticate a user by email/password and issue tokens.
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new HttpError(403, 'FORBIDDEN', 'Account is disabled');
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  },

  /**
   * Refresh token rotation: revoke old token, issue new pair.
   */
  async refresh(token: string) {
    const payload = verifyRefreshToken(token);
    if (!payload) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid refresh token');
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: token,
        userId: payload.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!storedToken) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Refresh token invalid or revoked');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User not found or disabled');
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = signAccessToken({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });
    const newRefreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  /**
   * Revoke a specific refresh token on logout.
   */
  async logout(userId: string, token: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, tokenHash: token },
      data: { revokedAt: new Date() },
    });
  },
};
