import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';
import { getHiddenUserIds } from '../lib/blocks';

export async function getTrendingLocations(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'explore:trending-locations';
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
      res.json({ success: true, data: cached });
      return;
    }

    // Aggregate counts in the database instead of pulling ~500 rows into JS.
    const grouped = await prisma.post.groupBy({
      by: ['locationCity', 'locationCountry'],
      where: {
        isDeleted: false,
        privacy: 'public',
        locationCity: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 12,
    });

    // Fetch one cover image per top city (most recent public post).
    const locations = await Promise.all(
      grouped.map(async (g) => {
        const cover = await prisma.post.findFirst({
          where: {
            isDeleted: false,
            privacy: 'public',
            locationCity: g.locationCity,
            locationCountry: g.locationCountry,
          },
          select: { mediaThumbnails: true, mediaUrls: true },
          orderBy: { postedAt: 'desc' },
        });
        return {
          city: g.locationCity as string,
          country: g.locationCountry || '',
          photo: cover ? cover.mediaThumbnails[0] || cover.mediaUrls[0] || null : null,
          count: g._count.id,
        };
      })
    );

    const result = { locations };
    await cacheSet(cacheKey, result, 900);

    res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getTrendingTags(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'explore:trending-tags';
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
      res.json({ success: true, data: cached });
      return;
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
        tags: { isEmpty: false },
      },
      select: { tags: true },
      orderBy: { postedAt: 'desc' },
      take: 500,
    });

    const tagCount = new Map<string, number>();
    for (const p of posts) {
      for (const tag of p.tags) {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      }
    }

    const tags = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    const result = { tags };
    await cacheSet(cacheKey, result, 900);

    res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedContent(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);

    // Cache the unfiltered pool, then filter per-viewer for block visibility.
    // Larger pool ensures we can still return `limit` items after filtering.
    const poolSize = limit * 3;
    const cacheKey = `explore:featured:pool:${poolSize}`;
    let pool = await cacheGet<any[]>(cacheKey);

    if (!pool) {
      pool = await prisma.post.findMany({
        where: {
          isDeleted: false,
          privacy: 'public',
        },
        orderBy: { saveCount: 'desc' },
        take: poolSize,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
      await cacheSet(cacheKey, pool, 900);
    }

    const hiddenIds = req.user ? await getHiddenUserIds(req.user.userId) : [];
    const hidden = new Set(hiddenIds);
    const posts = pool.filter((p: any) => !hidden.has(p.userId)).slice(0, limit);

    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
}
