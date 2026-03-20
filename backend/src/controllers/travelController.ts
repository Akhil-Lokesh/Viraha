import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
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

export async function getNearbyFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Math.min(Number(req.query.radius) || 50, 200);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: 'Valid lat and lng query parameters are required' },
      });
      return;
    }

    const { minLat, maxLat, minLng, maxLng } = getBoundingBox(lat, lng, radius);

    // Fetch posts within bounding box (coarse filter)
    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
        locationLat: { gte: minLat, lte: maxLat },
        locationLng: { gte: minLng, lte: maxLng },
      },
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      // Fetch more than needed to account for Haversine filtering
      take: limit * 3,
      orderBy: { postedAt: 'desc' },
      include: { user: { select: userSelect } },
    });

    // Apply precise Haversine distance filter
    const filtered = posts.filter((post) => {
      const postLat = Number(post.locationLat);
      const postLng = Number(post.locationLng);
      return haversineDistance(lat, lng, postLat, postLng) <= radius;
    });

    // Apply cursor pagination limit
    const hasMore = filtered.length > limit;
    const items = hasMore ? filtered.slice(0, limit) : filtered;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items,
        nextCursor,
        meta: {
          center: { lat, lng },
          radiusKm: radius,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
