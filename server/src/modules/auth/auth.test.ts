// Integration tests for Auth endpoints

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { cleanupTestOrg } from '../../test/testUtils.js';
import { isDbConnected } from '../../test/testSetup.js';

describe('Auth Endpoints', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    if (isDbConnected) {
      for (const orgId of createdOrgIds) {
        await cleanupTestOrg(orgId);
      }
    }
  });

  it('rejects malformed registration payload with validation error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        password: 'short',
      });

    expect(res.status).toBe(400);
  });

  it('registers a new organization and admin user', async () => {
    if (!isDbConnected) return;

    const timestamp = Date.now();
    const email = `test-admin-${timestamp}@example.com`;

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        organizationName: `Acme Corp ${timestamp}`,
        firstName: 'Alice',
        lastName: 'Admin',
        email,
        password: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe('ADMIN');

    if (res.body.data.user.organizationId) {
      createdOrgIds.push(res.body.data.user.organizationId);
    }
  });

  it('rejects registration with duplicate email', async () => {
    if (!isDbConnected) return;

    const timestamp = Date.now();
    const email = `duplicate-${timestamp}@example.com`;

    const firstRes = await request(app)
      .post('/api/auth/register')
      .send({
        organizationName: `Org First ${timestamp}`,
        firstName: 'Bob',
        lastName: 'Dup',
        email,
        password: 'Password123!',
      });

    if (firstRes.status === 201 && firstRes.body.data?.user?.organizationId) {
      createdOrgIds.push(firstRes.body.data.user.organizationId);

      const secondRes = await request(app)
        .post('/api/auth/register')
        .send({
          organizationName: `Org Second ${timestamp}`,
          firstName: 'Charlie',
          lastName: 'Dup',
          email,
          password: 'Password123!',
        });

      expect(secondRes.status).toBe(409);
    }
  });

  it('fails login with invalid credentials', async () => {
    if (!isDbConnected) return;

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
  });
});
