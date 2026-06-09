import { prisma } from './prisma';
import { cacheGet, cacheSet, cacheDel } from './cache';

const TTL_SECONDS = 60;

function blockedKey(userId: string): string {
  return `blocks:blockedBy:${userId}`;
}

function blockersKey(userId: string): string {
  return `blocks:blockersOf:${userId}`;
}

/**
 * IDs of users that `userId` has blocked. Cached briefly so hot read paths
 * (feed, explore, search) don't issue an extra round-trip per request.
 */
export async function getBlockedUserIds(userId: string): Promise<string[]> {
  const cached = await cacheGet<string[]>(blockedKey(userId));
  if (cached) return cached;
  const rows = await prisma.block.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  const ids = rows.map((r) => r.blockedId);
  await cacheSet(blockedKey(userId), ids, TTL_SECONDS);
  return ids;
}

/**
 * IDs of users that have blocked `userId`. Used to also hide content authored by
 * a user from people that user has blocked (symmetric visibility).
 */
export async function getBlockerIds(userId: string): Promise<string[]> {
  const cached = await cacheGet<string[]>(blockersKey(userId));
  if (cached) return cached;
  const rows = await prisma.block.findMany({
    where: { blockedId: userId },
    select: { blockerId: true },
  });
  const ids = rows.map((r) => r.blockerId);
  await cacheSet(blockersKey(userId), ids, TTL_SECONDS);
  return ids;
}

/**
 * Combined "hidden user IDs" for a viewer: everyone they have blocked plus
 * everyone who has blocked them. Use this for feed/search exclusions.
 */
export async function getHiddenUserIds(viewerId: string): Promise<string[]> {
  const [blocked, blockers] = await Promise.all([
    getBlockedUserIds(viewerId),
    getBlockerIds(viewerId),
  ]);
  return Array.from(new Set([...blocked, ...blockers]));
}

/**
 * Returns true if EITHER side has blocked the other. Use for write paths
 * (follow, comment-create) where the viewer is interacting with one specific
 * target user.
 */
export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: a, blockedId: b },
        { blockerId: b, blockedId: a },
      ],
    },
    select: { id: true },
  });
  return !!row;
}

export async function invalidateBlockCacheFor(...userIds: string[]): Promise<void> {
  await Promise.all(
    userIds.flatMap((id) => [cacheDel(blockedKey(id)), cacheDel(blockersKey(id))]),
  );
}

function mutedKey(userId: string): string {
  return `mutes:mutedBy:${userId}`;
}

/**
 * IDs of users that `userId` has muted. One-way and invisible to the muted
 * user: used to suppress their content in the muter's feed/explore/activity
 * streams only — profiles, post detail pages, and comments stay visible.
 * Cached briefly like the block lists since the same hot read paths use it.
 */
export async function getMutedUserIds(userId: string): Promise<string[]> {
  const cached = await cacheGet<string[]>(mutedKey(userId));
  if (cached) return cached;
  const rows = await prisma.mute.findMany({
    where: { muterId: userId },
    select: { mutedId: true },
  });
  const ids = rows.map((r) => r.mutedId);
  await cacheSet(mutedKey(userId), ids, TTL_SECONDS);
  return ids;
}

export async function invalidateMuteCacheFor(...userIds: string[]): Promise<void> {
  await Promise.all(userIds.map((id) => cacheDel(mutedKey(id))));
}
