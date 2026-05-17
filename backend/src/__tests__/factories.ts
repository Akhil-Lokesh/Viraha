import bcrypt from 'bcryptjs';
import { prisma } from './setup';
import { generateAccessToken } from '../utils/jwt';

let userCounter = 0;
let postCounter = 0;

interface TestUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  isPrivate: boolean;
}

interface TestPost {
  id: string;
  userId: string;
  privacy: string;
}

export async function createTestUser(
  overrides: { username?: string; isPrivate?: boolean } = {}
): Promise<TestUser> {
  userCounter += 1;
  const username = overrides.username ?? `user${userCounter}_${Date.now()}`;
  const email = `${username}@test.local`;
  const passwordHash = await bcrypt.hash('password123', 4);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      isPrivate: overrides.isPrivate ?? false,
    },
  });
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    isPrivate: user.isPrivate,
  };
}

export async function createTestPost(
  userId: string,
  overrides: { privacy?: string; isDeleted?: boolean } = {}
): Promise<TestPost> {
  postCounter += 1;
  const post = await prisma.post.create({
    data: {
      userId,
      caption: `Test post ${postCounter}`,
      mediaUrls: [`https://example.com/img${postCounter}.jpg`],
      mediaThumbnails: [`https://example.com/thumb${postCounter}.jpg`],
      locationLat: 37.7749,
      locationLng: -122.4194,
      locationName: 'San Francisco',
      privacy: overrides.privacy ?? 'public',
      isDeleted: overrides.isDeleted ?? false,
    },
  });
  return { id: post.id, userId: post.userId, privacy: post.privacy };
}

export async function createTestFollow(followerId: string, followingId: string): Promise<void> {
  await prisma.follow.create({
    data: { followerId, followingId, status: 'accepted' },
  });
}

/**
 * Returns the cookie value for the access JWT — supertest accepts the raw
 * `viraha_access=<token>` form via .set('Cookie', ...).
 */
export function getAuthCookie(userId: string): string {
  const token = generateAccessToken(userId);
  return `viraha_access=${token}`;
}
