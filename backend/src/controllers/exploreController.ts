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

    // Fetch one cover image per top city in a single DISTINCT ON query
    // (most recent public post per city/country) instead of N+1 findFirst calls.
    const cities = grouped.map((g) => g.locationCity as string);
    const countries = grouped.map((g) => g.locationCountry || '');

    const covers =
      grouped.length === 0
        ? []
        : await prisma.$queryRaw<
            Array<{
              location_city: string;
              location_country: string | null;
              media_thumbnails: string[];
              media_urls: string[];
            }>
          >`
            SELECT DISTINCT ON (p.location_city, p.location_country)
              p.location_city, p.location_country, p.media_thumbnails, p.media_urls
            FROM posts p
            JOIN unnest(${cities}::text[], ${countries}::text[]) AS t(city, country)
              ON p.location_city = t.city
              AND COALESCE(p.location_country, '') = t.country
            WHERE p.is_deleted = false AND p.privacy = 'public'
            ORDER BY p.location_city, p.location_country, p.posted_at DESC
          `;

    // Index covers by city|country for O(1) lookup when assembling the result.
    const coverByKey = new Map<string, { mediaThumbnails: string[]; mediaUrls: string[] }>();
    for (const c of covers) {
      const key = `${c.location_city}|${c.location_country || ''}`;
      coverByKey.set(key, { mediaThumbnails: c.media_thumbnails, mediaUrls: c.media_urls });
    }

    const locations = grouped.map((g) => {
      const country = g.locationCountry || '';
      const cover = coverByKey.get(`${g.locationCity}|${country}`);
      return {
        city: g.locationCity as string,
        country,
        photo: cover ? cover.mediaThumbnails[0] || cover.mediaUrls[0] || null : null,
        count: g._count.id,
      };
    });

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

    // Count tag frequency in Postgres via unnest + GROUP BY instead of pulling
    // hundreds of rows into JS and counting them in-process.
    const rows = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT tag, COUNT(*) AS count
      FROM posts p, unnest(p.tags) AS tag
      WHERE p.is_deleted = false AND p.privacy = 'public'
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `;

    const tags = rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));

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
