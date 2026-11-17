import { redis } from './redis';

// Each user's cached personal-feed pages carry a version in their key. Bumping
// the version (O(1), no key scans) orphans every cached page for that user;
// the orphans expire on their own short TTL.
const VERSION_TTL_SECONDS = 24 * 60 * 60;

function versionKey(userId: string): string {
  return `feed:personal:ver:${userId}`;
}

export async function personalFeedCacheKey(
  userId: string,
  limit: number,
  cursor: string | undefined,
): Promise<string> {
  let version = '0';
  const client = redis;
  if (client) {
    try {
      version = (await client.get(versionKey(userId))) ?? '0';
    } catch {
      // Caching is best-effort; an unversioned key is still correct within its TTL.
    }
  }
  return `feed:personal:${userId}:v${version}:${limit}:${cursor || 'first'}`;
}

/**
 * Drop the cached personal feeds of these users. Call whenever what a user's
 * feed should contain changes beyond new posts: follows, mutes, blocks.
 */
export async function invalidatePersonalFeedsFor(...userIds: string[]): Promise<void> {
  const client = redis;
  if (!client) return;
  try {
    await Promise.all(
      userIds.map((id) => client.multi().incr(versionKey(id)).expire(versionKey(id), VERSION_TTL_SECONDS).exec()),
    );
  } catch {
    // Best-effort: worst case the stale page lives out its short TTL.
  }
}
