import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { getHiddenUserIds } from '../lib/blocks';
import { UpdateTravelModeInput } from '../validators/travelValidators';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

export async function getTravelMode(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        travelMode: true,
        currentLat: true,
        currentLng: true,
        homeLat: true,
        homeLng: true,
        homeCity: true,
        homeCountry: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        mode: user.travelMode,
        currentLat: user.currentLat ? Number(user.currentLat) : null,
        currentLng: user.currentLng ? Number(user.currentLng) : null,
        homeLat: user.homeLat ? Number(user.homeLat) : null,
        homeLng: user.homeLng ? Number(user.homeLng) : null,
        homeCity: user.homeCity,
        homeCountry: user.homeCountry,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTravelMode(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as UpdateTravelModeInput;

    const updateData: Record<string, unknown> = {
      travelMode: data.mode,
    };

    if (data.mode === 'traveling') {
      updateData.currentLat = data.currentLat;
      updateData.currentLng = data.currentLng;
    } else {
      // Switching to 'local' — clear current coordinates
      updateData.currentLat = null;
      updateData.currentLng = null;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        travelMode: true,
        currentLat: true,
        currentLng: true,
        homeLat: true,
        homeLng: true,
        homeCity: true,
        homeCountry: true,
      },
    });

    res.json({
      success: true,
      data: {
        mode: user.travelMode,
        currentLat: user.currentLat ? Number(user.currentLat) : null,
        currentLng: user.currentLng ? Number(user.currentLng) : null,
        homeLat: user.homeLat ? Number(user.homeLat) : null,
        homeLng: user.homeLng ? Number(user.homeLng) : null,
        homeCity: user.homeCity,
        homeCountry: user.homeCountry,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Keyset cursor encoding: postedAt + id form a stable, unique sort key so
// pagination never skips or duplicates rows (a plain id cursor against a
// postedAt order does both). Encoded as "<postedAt ISO>|<id>".
const CURSOR_SEPARATOR = '|';

interface NearbyCursor {
  postedAt: Date;
  id: string;
}

function encodeNearbyCursor(row: { postedAt: Date; id: string }): string {
  return `${row.postedAt.toISOString()}${CURSOR_SEPARATOR}${row.id}`;
}

function decodeNearbyCursor(raw: string): NearbyCursor | null {
  const sepIndex = raw.indexOf(CURSOR_SEPARATOR);
  if (sepIndex <= 0 || sepIndex === raw.length - 1) return null;

  const postedAtRaw = raw.slice(0, sepIndex);
  const id = raw.slice(sepIndex + 1);
  const postedAt = new Date(postedAtRaw);

  if (isNaN(postedAt.getTime()) || !id) return null;

  return { postedAt, id };
}

export async function getNearbyFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Math.min(Number(req.query.radius) || 50, 200);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const rawCursor = req.query.cursor as string | undefined;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'Valid lat and lng query parameters are required' },
      });
      return;
    }

    let cursor: NearbyCursor | null = null;
    if (rawCursor) {
      cursor = decodeNearbyCursor(rawCursor);
      if (!cursor) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Invalid cursor' },
        });
        return;
      }
    }

    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radius);

    // Exclude content authored by users in a block relationship with the viewer
    const hiddenIds = await getHiddenUserIds(req.user!.userId);

    const baseWhere = {
      isDeleted: false,
      privacy: 'public' as const,
      locationLat: { gte: minLat, lte: maxLat },
      locationLng: { gte: minLng, lte: maxLng },
      ...(hiddenIds.length > 0 && { userId: { notIn: hiddenIds } }),
    };

    // Keyset predicate matching `orderBy [{ postedAt: desc }, { id: desc }]`:
    // (postedAt < cursor.postedAt) OR (postedAt = cursor.postedAt AND id < cursor.id)
    const keysetWhere = cursor
      ? {
          OR: [
            { postedAt: { lt: cursor.postedAt } },
            { postedAt: cursor.postedAt, id: { lt: cursor.id } },
          ],
        }
      : {};

    const orderBy = [{ postedAt: 'desc' as const }, { id: 'desc' as const }];

    // Iterate fetching batches until we collect `limit` Haversine-passing
    // items or the data source is exhausted. The bounding box is a coarse
    // pre-filter; the precise radius check rejects the box corners, so a
    // single capped fetch can prematurely end the feed.
    const batchSize = limit * 3;
    type NearbyPost = Awaited<ReturnType<typeof prisma.post.findMany>>[number];
    const passing: NearbyPost[] = [];
    let lastExamined: { postedAt: Date; id: string } | null = cursor;
    let exhausted = false;
    let hasMore = false;

    while (passing.length <= limit && !exhausted) {
      const batchKeyset = lastExamined
        ? {
            OR: [
              { postedAt: { lt: lastExamined.postedAt } },
              { postedAt: lastExamined.postedAt, id: { lt: lastExamined.id } },
            ],
          }
        : keysetWhere;

      const batch = await prisma.post.findMany({
        where: { ...baseWhere, ...batchKeyset },
        take: batchSize,
        orderBy,
        include: { user: { select: userSelect } },
      });

      if (batch.length === 0) {
        exhausted = true;
        break;
      }

      if (batch.length < batchSize) {
        exhausted = true;
      }

      // Advance the keyset to the last DB row examined in this batch so the
      // next batch (or nextCursor) continues from exactly where we stopped.
      const lastRow = batch[batch.length - 1];
      lastExamined = { postedAt: lastRow.postedAt, id: lastRow.id };

      for (const post of batch) {
        const postLat = Number(post.locationLat);
        const postLng = Number(post.locationLng);
        if (haversineDistance(lat, lng, postLat, postLng) <= radius) {
          passing.push(post);
          // One extra passing item proves there is another page.
          if (passing.length > limit) {
            hasMore = true;
            break;
          }
        }
      }

      if (hasMore) break;
    }

    const page = hasMore ? passing.slice(0, limit) : passing;

    // nextCursor is keyed off the last passing item we are returning, so the
    // next request resumes immediately after it (keyset, no skip/duplicate).
    const nextCursor =
      hasMore && page.length > 0 ? encodeNearbyCursor(page[page.length - 1]) : null;

    res.json({
      success: true,
      data: {
        items: page,
        nextCursor,
        meta: {
          lat,
          lng,
          radius,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
