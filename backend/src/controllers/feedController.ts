import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';
import { getHiddenUserIds } from '../lib/blocks';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function getPersonalizedFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    // Short per-user cache. Keyed by userId + cursor; the response is fully
    // derived from those two inputs, so it is safe to reuse for this user.
    // Short TTL bounds staleness from new posts/saves without invalidation.
    const cacheKey = `feed:personal:${userId}:${cursor || 'first'}`;
    const cached = await cacheGet<{ items: unknown[]; nextCursor: string | null }>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    // Independent lookups run in parallel.
    const [follows, hiddenIds] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId, status: 'accepted' },
        select: { followingId: true },
      }),
      getHiddenUserIds(userId),
    ]);
    const followedIds = follows.map((f) => f.followingId);

    // Include own posts + followed users' posts, excluding blocked users
    const feedUserIds = [userId, ...followedIds].filter((id) => !hiddenIds.includes(id));

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        userId: { in: feedUserIds },
        OR: [
          { privacy: 'public' },
          { privacy: 'followers', userId: { in: followedIds } },
          { userId },
        ],
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      // Tie-break on id so cursor pagination never skips rows sharing a postedAt.
      orderBy: [{ postedAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: userSelect } },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check save status for each post
    const postIds = items.map((p) => p.id);
    const saves = await prisma.save.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const savedPostIds = new Set(saves.map((s) => s.postId));

    const responseData = {
      items: items.map((post) => ({
        ...post,
        isSaved: savedPostIds.has(post.id),
      })),
      nextCursor,
    };

    // Best-effort short-lived cache for this user+cursor.
    await cacheSet(cacheKey, responseData, 45);

    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
}

export async function getDiscoverFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    // Cache discover feed for anonymous users (first page only)
    const cacheKey = !req.user && !cursor ? `feed:discover:${limit}` : null;
    if (cacheKey) {
      const cached = await cacheGet<{ items: any[]; nextCursor: string | null }>(cacheKey);
      if (cached) {
        res.json({ success: true, data: cached });
        return;
      }
    }

    let excludeUserIds: string[] = [];
    if (req.user) {
      const [follows, hiddenIds] = await Promise.all([
        prisma.follow.findMany({
          where: { followerId: req.user.userId },
          select: { followingId: true },
        }),
        getHiddenUserIds(req.user.userId),
      ]);
      excludeUserIds = Array.from(new Set([
        req.user.userId,
        ...follows.map((f) => f.followingId),
        ...hiddenIds,
      ]));
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
        ...(excludeUserIds.length > 0 && {
          userId: { notIn: excludeUserIds },
        }),
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      // Tie-break on id so cursor pagination never skips rows sharing a postedAt.
      orderBy: [{ postedAt: 'desc' }, { id: 'desc' }],
      include: { user: { select: userSelect } },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check save status if authenticated
    let savedPostIds = new Set<string>();
    if (req.user) {
      const postIds = items.map((p) => p.id);
      const saves = await prisma.save.findMany({
        where: { userId: req.user.userId, postId: { in: postIds } },
        select: { postId: true },
      });
      savedPostIds = new Set(saves.map((s) => s.postId));
    }

    const responseData = {
      items: items.map((post) => ({
        ...post,
        isSaved: savedPostIds.has(post.id),
      })),
      nextCursor,
    };

    // Cache anonymous first-page results for 5 minutes
    if (cacheKey) {
      await cacheSet(cacheKey, responseData, 300);
    }

    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
}
