import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { generateAccessToken } from '../utils/jwt';

const prisma = new PrismaClient();

let counter = 0;

function unique() {
  counter++;
  return `${Date.now()}_${counter}`;
}

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const id = unique();
  const passwordHash = await hashPassword('password123');
  return prisma.user.create({
    data: {
      username: `user_${id}`,
      email: `user_${id}@test.com`,
      passwordHash,
      displayName: `Test User ${id}`,
      ...overrides,
    },
  });
}

export async function createTestPost(userId: string, overrides: Record<string, unknown> = {}) {
  return prisma.post.create({
    data: {
      userId,
      caption: 'Test post caption',
      mediaUrls: ['https://example.com/photo.jpg'],
      mediaThumbnails: ['https://example.com/thumb.jpg'],
      locationLat: 40.7128,
      locationLng: -74.006,
      locationName: 'New York',
      locationCity: 'New York',
      locationCountry: 'US',
      privacy: 'public',
      tags: ['test'],
      ...overrides,
    },
  });
}

export async function createTestAlbum(userId: string, overrides: Record<string, unknown> = {}) {
  const id = unique();
  return prisma.album.create({
    data: {
      userId,
      title: `Test Album ${id}`,
      slug: `test-album-${id}`,
      privacy: 'public',
      ...overrides,
    },
  });
}

export async function createTestJournal(userId: string, overrides: Record<string, unknown> = {}) {
  const id = unique();
  return prisma.journal.create({
    data: {
      userId,
      title: `Test Journal ${id}`,
      slug: `test-journal-${id}`,
      privacy: 'public',
      status: 'draft',
      ...overrides,
    },
  });
}

export async function createTestJournalEntry(journalId: string, overrides: Record<string, unknown> = {}) {
  return prisma.journalEntry.create({
    data: {
      journalId,
      title: 'Test Entry',
      content: 'This is test content for the journal entry.',
      sortOrder: 0,
      ...overrides,
    },
  });
}

export function getAuthCookie(userId: string): string {
  const token = generateAccessToken(userId);
  return `viraha_access=${token}`;
}

export { prisma };
