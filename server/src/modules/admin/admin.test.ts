// Security & Authorization tests (Cross-Organization isolation)

import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../lib/prisma.js';
import { seedTestOrg, cleanupTestOrg } from '../../test/testUtils.js';
import { signAccessToken } from '../../lib/tokens.js';
import { isDbConnected } from '../../test/testSetup.js';

describe('Security & Multi-Tenant Isolation', () => {
  const createdOrgIds: string[] = [];

  afterAll(async () => {
    if (isDbConnected) {
      for (const orgId of createdOrgIds) {
        await cleanupTestOrg(orgId);
      }
    }
  });

  it('prevents non-authenticated requests from accessing admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });

  it('prevents EMPLOYEE role from accessing ADMIN-only endpoints', async () => {
    if (!isDbConnected) return;

    const { org, user } = await seedTestOrg('employee-test');
    createdOrgIds.push(org.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'EMPLOYEE' },
    });

    const token = signAccessToken({
      userId: user.id,
      organizationId: org.id,
      role: 'EMPLOYEE',
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('prevents Admin of Org A from deleting documents belonging to Org B', async () => {
    if (!isDbConnected) return;

    const orgA = await seedTestOrg('A');
    const orgB = await seedTestOrg('B');
    createdOrgIds.push(orgA.org.id, orgB.org.id);

    // Create Document in Org B
    const docB = await prisma.document.create({
      data: {
        organizationId: orgB.org.id,
        uploadedById: orgB.user.id,
        title: 'Secret Doc B',
        originalName: 'b.txt',
        mimeType: 'text/plain',
        fileSize: 100,
        storageKey: `key-${Date.now()}`,
        checksum: 'checksum123',
        status: 'INDEXED',
      },
    });

    // Login as Admin A
    const tokenA = signAccessToken({
      userId: orgA.user.id,
      organizationId: orgA.org.id,
      role: 'ADMIN',
    });

    // Admin A attempts to delete Doc B
    const res = await request(app)
      .delete(`/api/admin/documents/${docB.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(404);
  });
});
