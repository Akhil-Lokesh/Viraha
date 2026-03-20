import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Get collective content at a location — user's own, friends', and public.
 * Respects privacy: only shows public content from non-followed users.
 */
export async function handleGetPlaceStories(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId;
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 0.01;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'lat and lng are required' });
      return;
    }

    const locationFilter = {
      locationLat: { gte: lat - radius, lte: lat + radius },
      locationLng: { gte: lng - radius, lte: lng + radius },
    };

    // User's own content
    const myPosts = userId ? await prisma.post.findMany({
      where: { userId, isDeleted: false, ...locationFilter },
      orderBy: { postedAt: 'desc' },
      take: 20,
      select: {
        id: true, caption: true, mediaThumbnails: true, mediaUrls: true,
        locationName: true, postedAt: true,
        user: { select: { username: true, displayName: true, avatar: true } },
      },
    }) : [];

    // Friends' content (people user follows)
    let friendPosts: typeof myPosts = [];
    if (userId) {
      const followingIds = await prisma.follow.findMany({
        where: { followerId: userId, status: 'accepted' },
        select: { followingId: true },
      });
      const friendIds = followingIds.map((f) => f.followingId);

      if (friendIds.length > 0) {
        friendPosts = await prisma.post.findMany({
          where: {
            userId: { in: friendIds },
            isDeleted: false,
            privacy: { in: ['public', 'followers'] },
            ...locationFilter,
          },
          orderBy: { postedAt: 'desc' },
          take: 20,
          select: {
            id: true, caption: true, mediaThumbnails: true, mediaUrls: true,
            locationName: true, postedAt: true,
            user: { select: { username: true, displayName: true, avatar: true } },
          },
        });
      }
    }

    // Public community content (anonymized count)
    const communityCount = await prisma.post.count({
      where: {
        isDeleted: false,
        privacy: 'public',
        ...(userId ? { userId: { not: userId } } : {}),
        ...locationFilter,
      },
    });

    res.json({
      success: true,
      data: {
        myStories: myPosts,
        friendStories: friendPosts,
        communityCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Discover kindred travelers — users with highest geographic overlap.
 */
export async function handleGetKindredTravelers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const kindred = await prisma.$queryRaw<Array<{
      user_id: string;
      username: string;
      display_name: string | null;
      avatar: string | null;
      overlap_count: bigint;
    }>>`
      WITH my_cities AS (
        SELECT DISTINCT location_city, location_country
        FROM posts
        WHERE user_id = ${userId}::uuid AND is_deleted = false AND location_city IS NOT NULL
      ),
      other_users AS (
        SELECT p.user_id, COUNT(DISTINCT p.location_city) AS overlap_count
        FROM posts p
        JOIN my_cities mc ON p.location_city = mc.location_city AND p.location_country = mc.location_country
        WHERE p.user_id != ${userId}::uuid
          AND p.is_deleted = false
          AND p.privacy = 'public'
        GROUP BY p.user_id
        HAVING COUNT(DISTINCT p.location_city) >= 2
        ORDER BY overlap_count DESC
        LIMIT 20
      )
      SELECT ou.user_id, u.username, u.display_name, u.avatar, ou.overlap_count
      FROM other_users ou
      JOIN users u ON u.id = ou.user_id
      WHERE u.is_active = true AND u.is_private = false
    `;

    res.json({
      success: true,
      data: kindred.map((k) => ({
        userId: k.user_id,
        username: k.username,
        displayName: k.display_name,
        avatar: k.avatar,
        sharedPlaces: Number(k.overlap_count),
      })),
    });
  } catch (err) {
    next(err);
  }
}
