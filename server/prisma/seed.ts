import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or find Organization
  let org = await prisma.organization.findUnique({
    where: { slug: 'acme-enterprise' },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Acme Enterprise',
        slug: 'acme-enterprise',
      },
    });
    console.log('✅ Created Organization:', org.name);
  }

  // 2. Create Admin User
  const hashedPassword = await argon2.hash('password123');

  let admin = await prisma.user.findUnique({
    where: { email: 'admin@enterprise.ai' },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@enterprise.ai',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
        organizationId: org.id,
      },
    });
    console.log('✅ Created Admin User: admin@enterprise.ai / password123');
  }

  // 3. Create Employee User
  let employee = await prisma.user.findUnique({
    where: { email: 'employee@enterprise.ai' },
  });

  if (!employee) {
    employee = await prisma.user.create({
      data: {
        email: 'employee@enterprise.ai',
        passwordHash: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Connor',
        role: 'EMPLOYEE',
        isActive: true,
        organizationId: org.id,
      },
    });
    console.log('✅ Created Employee User: employee@enterprise.ai / password123');
  }

  // 4. Create sample Documents if none exist
  const existingDocs = await prisma.document.count({
    where: { organizationId: org.id },
  });

  if (existingDocs === 0) {
    const doc1 = await prisma.document.create({
      data: {
        organizationId: org.id,
        uploadedById: admin.id,
        title: 'Employee Handbook 2026',
        originalName: 'Employee Handbook 2026.pdf',
        mimeType: 'application/pdf',
        fileSize: 2450000,
        storageKey: `organizations/${org.id}/documents/employee-handbook-2026.pdf`,
        checksum: 'checksum-1',
        status: 'INDEXED',
        indexedAt: new Date(),
      },
    });

    await prisma.documentChunk.create({
      data: {
        documentId: doc1.id,
        chunkIndex: 0,
        content:
          'Full-time employees receive 20 days of paid time off (PTO) annually. PTO accrues on a bi-weekly basis starting from your first day of employment. Unused PTO up to 5 days can roll over to the following calendar year with manager approval.',
        tokenCount: 45,
      },
    });

    const doc2 = await prisma.document.create({
      data: {
        organizationId: org.id,
        uploadedById: admin.id,
        title: 'Remote Work Policy & Guidelines',
        originalName: 'Remote Work Policy & Guidelines.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 890000,
        storageKey: `organizations/${org.id}/documents/remote-work-policy.docx`,
        checksum: 'checksum-2',
        status: 'INDEXED',
        indexedAt: new Date(),
      },
    });

    await prisma.documentChunk.create({
      data: {
        documentId: doc2.id,
        chunkIndex: 0,
        content:
          'Employees are permitted up to 3 days of remote work per week under our hybrid policy. Core collaboration hours remain 10:00 AM to 4:00 PM EST across all engineering and operations teams.',
        tokenCount: 40,
      },
    });

    const doc3 = await prisma.document.create({
      data: {
        organizationId: org.id,
        uploadedById: admin.id,
        title: 'Security & Compliance Standards 2026',
        originalName: 'Security & Compliance Standards 2026.txt',
        mimeType: 'text/plain',
        fileSize: 320000,
        storageKey: `organizations/${org.id}/documents/security-compliance.txt`,
        checksum: 'checksum-3',
        status: 'INDEXED',
        indexedAt: new Date(),
      },
    });

    await prisma.documentChunk.create({
      data: {
        documentId: doc3.id,
        chunkIndex: 0,
        content:
          'Multi-factor authentication (MFA) is mandatory across all enterprise portals and SSO login systems. Laptops must run encrypted disks, and passphrases must be at least 12 characters rotated every 90 days.',
        tokenCount: 38,
      },
    });

    console.log('✅ Created sample indexed documents with knowledge chunks.');
  }

  console.log('✨ Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
