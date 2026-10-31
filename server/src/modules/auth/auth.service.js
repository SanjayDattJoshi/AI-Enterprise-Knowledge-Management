// Server: Auth Service
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { db } from '../../db/index.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/tokens.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { config } from '../../config/index.js';

export const authService = {
  async register(orgName, firstName, lastName, email, password) {
    const existing = await db.users.findByEmail(email);
    if (existing) {
      throw new HttpError(409, 'DUPLICATE_ENTRY', 'A user with this email already exists');
    }

    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let org = await db.organizations.findBySlug(slug);
    if (!org) {
      org = await db.organizations.create({ name: orgName, slug });
    }

    const passwordHash = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS || 10);
    const user = await db.users.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'ADMIN',
      organizationId: org.id,
    });

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: org.id,
      role: user.role,
    });

    const rawRefreshToken = signRefreshToken(user.id);
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshTokens.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        role: user.role,
        organization: { id: org.id, name: org.name, slug: org.slug },
      },
    };
  },

  async login(email, password) {
    const user = await db.users.findByEmail(email);
    if (!user) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.is_active && user.isActive === false) {
      throw new HttpError(401, 'ACCOUNT_DISABLED', 'Account is disabled. Please contact administrator.');
    }

    const isValid = await bcrypt.compare(password, user.password_hash || user.passwordHash);
    if (!isValid) {
      throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const orgId = user.organization_id || user.organizationId;
    const org = await db.organizations.findById(orgId);

    const accessToken = signAccessToken({
      userId: user.id,
      organizationId: orgId,
      role: user.role,
    });

    const rawRefreshToken = signRefreshToken(user.id);
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshTokens.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        role: user.role,
        organization: org ? { id: org.id, name: org.name, slug: org.slug } : null,
      },
    };
  },

  async refresh(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenRecord = await db.refreshTokens.find(tokenHash);
    if (!tokenRecord) {
      throw new HttpError(401, 'UNAUTHORIZED', 'Refresh token has been revoked');
    }

    const user = await db.users.findById(payload.userId);
    if (!user || (!user.is_active && user.isActive === false)) {
      throw new HttpError(401, 'UNAUTHORIZED', 'User not found or disabled');
    }

    await db.refreshTokens.revoke(tokenHash);

    const orgId = user.organization_id || user.organizationId;
    const org = await db.organizations.findById(orgId);

    const newAccessToken = signAccessToken({
      userId: user.id,
      organizationId: orgId,
      role: user.role,
    });

    const newRawRefreshToken = signRefreshToken(user.id);
    const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.refreshTokens.create({
      tokenHash: newTokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        role: user.role,
        organization: org ? { id: org.id, name: org.name, slug: org.slug } : null,
      },
    };
  },

  async logout(_userId, refreshToken) {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await db.refreshTokens.revoke(tokenHash);
    }
  },
};
