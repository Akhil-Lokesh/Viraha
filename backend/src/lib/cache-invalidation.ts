import { cacheDel, cacheDelPattern } from './cache';

export async function invalidatePostCache(postId: string): Promise<void> {
  await cacheDel(`post:${postId}`);
  await cacheDelPattern('feed:*');
  await cacheDelPattern('map:*');
  await cacheDelPattern('explore:*');
}

export async function invalidateUserCache(userId: string): Promise<void> {
  await cacheDel(`user:${userId}`);
  await cacheDelPattern(`user:profile:*`);
}

export async function invalidateFeedCaches(): Promise<void> {
  await cacheDelPattern('feed:*');
}

export async function invalidateJournalCache(journalId?: string): Promise<void> {
  if (journalId) {
    await cacheDel(`journal:${journalId}`);
  }
  await cacheDelPattern('map:*');
}

export async function invalidateExploreCaches(): Promise<void> {
  await cacheDelPattern('explore:*');
}
