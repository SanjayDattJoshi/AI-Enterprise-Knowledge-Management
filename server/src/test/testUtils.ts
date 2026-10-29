// Server: Test seeding and helper utilities

import { prisma } from '../lib/prisma.js';
import { hashPassword } from '../lib/password.js';

export const seedTestOrg = async (suffix = '1') => {
  const timestamp = Date.now();
  const slug = `test-org-${suffix}-${timestamp}`;
  const email = `admin-${suffix}-${timestamp}@test.com`;

  const org = await prisma.organization.create({
    data: {
      name: `Test Org ${suffix}`,
      slug,
    },
  });

  const passwordHash = await hashPassword('password123');

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      firstName: 'Admin',
      lastName: `User ${suffix}`,
      email,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  return { org, user };
};

export const cleanupTestOrg = async (orgId: string) => {
  try {
    await prisma.documentChunk.deleteMany({
      where: { document: { organizationId: orgId } },
    });
    await prisma.document.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { organizationId: orgId } },
    });
    await prisma.feedback.deleteMany({
      where: { user: { organizationId: orgId } },
    });
    await prisma.message.deleteMany({
      where: { conversation: { organizationId: orgId } },
    });
    await prisma.conversation.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.searchQuery.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.user.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.organization.delete({
      where: { id: orgId },
    });
  } catch (error) {
    // Ignore
  }
};
