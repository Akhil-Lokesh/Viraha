import { beforeAll, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://viraha:viraha_test_password@localhost:5434/viraha_test';

// Override DATABASE_URL for Prisma in tests
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-at-least-10-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-10-chars';
process.env.CORS_ORIGIN = 'http://localhost:3000';

const prisma = new PrismaClient({
  datasourceUrl: TEST_DATABASE_URL,
});

// Table names in deletion order (respects foreign key constraints)
const TABLE_NAMES = [
  'journal_entries',
  'album_posts',
  'activities',
  'saves',
  'comments',
  'reports',
  'follows',
  'refresh_tokens',
  'password_resets',
  'journals',
  'albums',
  'posts',
  'users',
] as const;

export async function cleanDatabase(): Promise<void> {
  for (const table of TABLE_NAMES) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };

beforeAll(async () => {
  // Run migrations against the test database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });

  await prisma.$connect();
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
