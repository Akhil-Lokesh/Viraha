import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';
import crypto from 'crypto';

interface MapMarker {
  id: string;
  type: 'post' | 'journal';
  lat: number;
  lng: number;
  thumbnail: string | null;
  title: string;
  locationName: string | null;
  date: string;
  journalId?: string;
}

interface MapMarkersResult {
  markers: MapMarker[];
}

interface MapQueryFilters {
  swLat?: string;
  swLng?: string;
  neLat?: string;
  neLng?: string;
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

const postMarkerSelect = {
  id: true,
  locationLat: true,
  locationLng: true,
  locationName: true,
  mediaThumbnails: true,
  caption: true,
  postedAt: true,
} satisfies Prisma.PostSelect;

type PostMarkerRow = Prisma.PostGetPayload<{ select: typeof postMarkerSelect }>;

function toPostMarker(p: PostMarkerRow): MapMarker {
  return {
    id: p.id,
    type: 'post',
    lat: Number(p.locationLat),
    lng: Number(p.locationLng),
    thumbnail: p.mediaThumbnails[0] || null,
    title: p.caption?.slice(0, 60) || p.locationName || 'Post',
    locationName: p.locationName,
    date: p.postedAt.toISOString(),
  };
}

function wantsPosts(type: string | undefined): boolean {
  return !type || type === 'all' || type === 'posts' || type === 'post';
}

function applyPostBoundsAndDates(
  where: Prisma.PostWhereInput,
  { swLat, swLng, neLat, neLng, startDate, endDate }: MapQueryFilters
): Prisma.PostWhereInput {
  const next: Prisma.PostWhereInput = { ...where };

  if (swLat && swLng && neLat && neLng) {
    next.locationLat = { gte: Number(swLat), lte: Number(neLat) };
    next.locationLng = { gte: Number(swLng), lte: Number(neLng) };
  }

  if (startDate || endDate) {
    const postedAt: Prisma.DateTimeFilter = {};
    if (startDate) postedAt.gte = new Date(startDate);
    if (endDate) postedAt.lte = new Date(endDate);
    next.postedAt = postedAt;
  }

  return next;
}

/**
 * Builds the publicly visible marker set: public posts with showLocation=true
 * plus public journal entries. Contains nothing viewer-specific, so the result
 * is safe to share across all viewers (including anonymous) via the cache.
 */
async function fetchPublicMarkers(
  filters: MapQueryFilters,
  limit: number
): Promise<MapMarker[]> {
  const { swLat, swLng, neLat, neLng, type, userId, startDate, endDate } = filters;
  const markers: MapMarker[] = [];

  if (wantsPosts(type)) {
    // Location-private posts (showLocation=false) are excluded outright —
    // a null-coordinate map pin is useless. The owner's own hidden pins are
    // layered on top per-request (uncached) by the route handler.
    let postWhere: Prisma.PostWhereInput = {
      isDeleted: false,
      privacy: 'public',
      showLocation: true,
    };
    if (userId) postWhere.userId = userId;
    postWhere = applyPostBoundsAndDates(postWhere, filters);

    const posts = await prisma.post.findMany({
      where: postWhere,
      take: limit,
      orderBy: { postedAt: 'desc' },
      select: postMarkerSelect,
    });

    for (const p of posts) {
      markers.push(toPostMarker(p));
    }
  }

  if (!type || type === 'all' || type === 'journals' || type === 'journal') {
    const journalFilter: Prisma.JournalWhereInput = {
      isDeleted: false,
      privacy: 'public',
      status: 'published',
    };
    if (userId) journalFilter.userId = userId;

    const entryWhere: Prisma.JournalEntryWhereInput = {
      isDeleted: false,
      locationLat: { not: null },
      locationLng: { not: null },
      journal: journalFilter,
    };

    if (swLat && swLng && neLat && neLng) {
      entryWhere.locationLat = { not: null, gte: Number(swLat), lte: Number(neLat) };
      entryWhere.locationLng = { not: null, gte: Number(swLng), lte: Number(neLng) };
    }

    if (startDate || endDate) {
      entryWhere.OR = [
        {
          date: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
        {
          date: null,
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        },
      ];
    }

    const entries = await prisma.journalEntry.findMany({
      where: entryWhere,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        locationLat: true,
        locationLng: true,
        locationName: true,
        mediaUrls: true,
        title: true,
        journalId: true,
        date: true,
        createdAt: true,
      },
    });

    for (const e of entries) {
      markers.push({
        id: e.id,
        type: 'journal',
        lat: Number(e.locationLat),
        lng: Number(e.locationLng),
        thumbnail: e.mediaUrls[0] || null,
        title: e.title || e.locationName || 'Journal Entry',
        locationName: e.locationName,
        journalId: e.journalId,
        date: (e.date || e.createdAt).toISOString(),
      });
    }
  }

  return markers;
}

/**
 * The viewer's own location-private pins (showLocation=false). Never cached:
 * keeping viewer data out of the cache keeps the keyspace bounded (one entry
 * per viewport/filter combination instead of one per viewer per viewport) and
 * guarantees one viewer's hidden pins can never be served to another.
 */
async function fetchOwnHiddenMarkers(
  viewerId: string,
  filters: MapQueryFilters,
  limit: number
): Promise<MapMarker[]> {
  if (!wantsPosts(filters.type)) return [];
  // A userId filter for someone else's pins can never include the viewer's
  // own hidden posts — skip the query entirely.
  if (filters.userId && filters.userId !== viewerId) return [];

  const where = applyPostBoundsAndDates(
    {
      isDeleted: false,
      privacy: 'public',
      userId: viewerId,
      showLocation: false,
    },
    filters
  );

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    orderBy: { postedAt: 'desc' },
    select: postMarkerSelect,
  });

  return posts.map(toPostMarker);
}

export async function getMapMarkers(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      swLat, swLng, neLat, neLng,
      type, userId, startDate, endDate,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const viewerId = req.user?.userId ?? null;
    const filters: MapQueryFilters = { swLat, swLng, neLat, neLng, type, userId, startDate, endDate };

    // The cache holds ONLY the public-visible set, so the key is shared by all
    // viewers — no viewerId component, keeping the keyspace bounded at
    // (#viewports × #filter combos) instead of multiplying by user count.
    const cacheKey = `map:${swLat}:${swLng}:${neLat}:${neLng}:${type || 'all'}:${userId || ''}:${startDate || ''}:${endDate || ''}:${limit}:public`;
    const cacheHash = crypto.createHash('md5').update(cacheKey).digest('hex');

    let publicResult = await cacheGet<MapMarkersResult>(`map:${cacheHash}`);
    if (!publicResult) {
      publicResult = { markers: await fetchPublicMarkers(filters, limit) };
      await cacheSet(`map:${cacheHash}`, publicResult, 60);
    }

    // Per-viewer overlay (cheap indexed query, never cached): the viewer's own
    // showLocation=false pins, visible only to them.
    const ownHidden = viewerId
      ? await fetchOwnHiddenMarkers(viewerId, filters, limit)
      : [];

    const result: MapMarkersResult =
      ownHidden.length > 0
        ? { markers: [...publicResult.markers, ...ownHidden] }
        : publicResult;

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
