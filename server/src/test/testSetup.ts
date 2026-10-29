// Server: Test setup and teardown lifecycle

import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma.js';

export let isDbConnected = false;

beforeAll(async () => {
  try {
    const check = Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000)),
    ]);
    await check;
    isDbConnected = true;
  } catch (error) {
    isDbConnected = false;
  }
});

afterAll(async () => {
  if (isDbConnected) {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignore
    }
  }
});
