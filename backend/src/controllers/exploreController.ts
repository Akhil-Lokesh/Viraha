import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';
import { getHiddenUserIds, getMutedUserIds } from '../lib/blocks';
import { redactPostLocation } from '../utils/locationPrivacy';

/**
 * Users whose content the viewer must not see in explore surfaces:
 * blocked (both directions) plus muted (one-way). Empty for anonymous viewers.
 */
interface TrendingLocation {
  city: string;
  country: string;
  photo: string | null;
  count: number;
}

interface TrendingTag {
  tag: string;
  count: number;
}

async function getExcludedUserIds(viewerId: string | undefined): Promise<string[]> {
  if (!viewerId) return [];
  const [hiddenIds, mutedIds] = await Promise.all([
    getHiddenUserIds(viewerId),
    getMutedUserIds(viewerId),
  ]);
  return Array.from(new Set([...hiddenIds, ...mutedIds]));
}

export async function getTrendingLocations(req: Request, res: Response, next: NextFunction) {
  try {
    // Viewers with blocks/mutes get a personalized (uncached) result so the
    // shared trending cache is never poisoned with per-viewer exclusions.
    const excludeIds = await getExcludedUserIds(req.user?.userId);
    const useSharedCache = excludeIds.length === 0;

    const cacheKey = 'explore:trending-locations';
    if (useSharedCache) {
      const cached = await cacheGet<{ locations: TrendingLocation[] }>(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
        res.json({ success: true, data: cached });
        return;
      }
    }

    // Aggregate counts in the database instead of pulling ~500 rows into JS.
    const grouped = await prisma.post.groupBy({
      by: ['locationCity', 'locationCountry'],
      where: {
        isDeleted: false,
        privacy: 'public',
        locationCity: { not: null },
        ...(excludeIds.length > 0 && { userId: { notIn: excludeIds } }),
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
              AND p.user_id <> ALL(${excludeIds}::uuid[])
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
    if (useSharedCache) {
      await cacheSet(cacheKey, result, 900);
    }

    // Personalized (block/mute-filtered) results must never be cached by
    // shared HTTP caches.
    res.set(
      'Cache-Control',
      useSharedCache ? 'public, max-age=900, stale-while-revalidate=300' : 'private, no-store'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getTrendingTags(req: Request, res: Response, next: NextFunction) {
  try {
    // Same shared-cache bypass as trending locations for viewers with
    // blocks/mutes.
    const excludeIds = await getExcludedUserIds(req.user?.userId);
    const useSharedCache = excludeIds.length === 0;

    const cacheKey = 'explore:trending-tags';
    if (useSharedCache) {
      const cached = await cacheGet<{ tags: TrendingTag[] }>(cacheKey);
      if (cached) {
        res.set('Cache-Control', 'public, max-age=900, stale-while-revalidate=300');
        res.json({ success: true, data: cached });
        return;
      }
    }

    // Count tag frequency in Postgres via unnest + GROUP BY instead of pulling
    // hundreds of rows into JS and counting them in-process.
    // (`<> ALL` over an empty array is always true, so the filter is a no-op
    // for viewers with nothing to exclude.)
    const rows = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
      SELECT tag, COUNT(*) AS count
      FROM posts p, unnest(p.tags) AS tag
      WHERE p.is_deleted = false AND p.privacy = 'public'
        AND p.user_id <> ALL(${excludeIds}::uuid[])
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `;

    const tags = rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));

    const result = { tags };
    if (useSharedCache) {
      await cacheSet(cacheKey, result, 900);
    }

    // Personalized (block/mute-filtered) results must never be cached by
    // shared HTTP caches.
    res.set(
      'Cache-Control',
      useSharedCache ? 'public, max-age=900, stale-while-revalidate=300' : 'private, no-store'
    );
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// Shape of one cached featured-pool entry: a full post row (every scalar,
// including showLocation, which the per-viewer redaction step depends on)
// plus the author summary.
type FeaturedPoolPost = Prisma.PostGetPayload<{
  include: {
    user: { select: { id: true; username: true; displayName: true; avatar: true } };
  };
}>;

/**
 * A cached pool entry is only usable when it carries the showLocation flag —
 * redactPostLocation treats a missing flag as "visible", so deserializing a
 * stale cache shape (written before the flag existed) must force a refetch
 * rather than silently skip redaction.
 */
function isRedactablePoolEntry(p: FeaturedPoolPost): boolean {
  return typeof p.showLocation === 'boolean';
}

export async function getFeaturedContent(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);

    // Cache the unfiltered pool, then filter per-viewer for block visibility.
    // Larger pool ensures we can still return `limit` items after filtering.
    const poolSize = limit * 3;
    const cacheKey = `explore:featured:pool:${poolSize}`;
    const cached = await cacheGet<FeaturedPoolPost[]>(cacheKey);
    let pool = cached && cached.every(isRedactablePoolEntry) ? cached : null;

    if (!pool) {
      // No explicit `select`: Prisma returns every scalar column, which
      // includes showLocation — required by the redaction step below.
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

    const viewerId = req.user?.userId ?? null;
    const excludeIds = await getExcludedUserIds(req.user?.userId);
    const hidden = new Set(excludeIds);
    const posts = pool
      .filter((p) => !hidden.has(p.userId))
      .slice(0, limit)
      .map((p) => redactPostLocation(p, viewerId));

    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
}
