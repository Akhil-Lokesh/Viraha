import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';

export async function getTrendingLocations(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = 'explore:trending-locations';
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
        locationCity: { not: null },
      },
      select: {
        locationCity: true,
        locationCountry: true,
        mediaThumbnails: true,
        mediaUrls: true,
      },
      orderBy: { postedAt: 'desc' },
      take: 500,
    });

    const cityMap = new Map<string, { city: string; country: string; photo: string | null; count: number }>();

    for (const p of posts) {
      const key = `${p.locationCity}:${p.locationCountry}`;
      if (!cityMap.has(key)) {
        const photo = p.mediaThumbnails[0] || p.mediaUrls[0] || null;
        cityMap.set(key, {
          city: p.locationCity!,
          country: p.locationCountry || '',
          photo,
          count: 0,
        });
      }
      cityMap.get(key)!.count++;
    }

    const locations = Array.from(cityMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const result = { locations };
    await cacheSet(cacheKey, result, 900);

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

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedContent(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);

    const cacheKey = `explore:featured:${limit}`;
    const cached = await cacheGet<any>(cacheKey);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
      },
      orderBy: { saveCount: 'desc' },
      take: limit,
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

    const result = { posts };
    await cacheSet(cacheKey, result, 900);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
