import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { cacheGet, cacheSet } from '../lib/cache';
import crypto from 'crypto';

export async function getMapMarkers(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      swLat, swLng, neLat, neLng,
      type, userId,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(Number(req.query.limit) || 200, 500);

    const cacheKey = `map:${swLat}:${swLng}:${neLat}:${neLng}:${type || 'all'}:${userId || ''}`;
    const cacheHash = crypto.createHash('md5').update(cacheKey).digest('hex');
    const cached = await cacheGet<any>(`map:${cacheHash}`);
    if (cached) {
      res.json({ success: true, data: cached });
      return;
    }

    const markers: any[] = [];

    // Fetch post markers
    if (!type || type === 'all' || type === 'posts') {
      const postWhere: any = {
        isDeleted: false,
        privacy: 'public',
      };

      if (userId) postWhere.userId = userId;

      if (swLat && swLng && neLat && neLng) {
        postWhere.locationLat = { gte: Number(swLat), lte: Number(neLat) };
        postWhere.locationLng = { gte: Number(swLng), lte: Number(neLng) };
      }

      const posts = await prisma.post.findMany({
        where: postWhere,
        take: limit,
        orderBy: { postedAt: 'desc' },
        select: {
          id: true,
          locationLat: true,
          locationLng: true,
          locationName: true,
          mediaThumbnails: true,
          caption: true,
        },
      });

      for (const p of posts) {
        markers.push({
          id: p.id,
          type: 'post',
          lat: Number(p.locationLat),
          lng: Number(p.locationLng),
          thumbnail: p.mediaThumbnails[0] || null,
          title: p.caption?.slice(0, 60) || p.locationName || 'Post',
          locationName: p.locationName,
        });
      }
    }

    // Fetch journal entry markers
    if (!type || type === 'all' || type === 'journals') {
      const entryWhere: any = {
        isDeleted: false,
        locationLat: { not: null },
        locationLng: { not: null },
        journal: {
          isDeleted: false,
          privacy: 'public',
          status: 'published',
        },
      };

      if (userId) entryWhere.journal.userId = userId;

      if (swLat && swLng && neLat && neLng) {
        entryWhere.locationLat = { ...entryWhere.locationLat, gte: Number(swLat), lte: Number(neLat) };
        entryWhere.locationLng = { not: null, gte: Number(swLng), lte: Number(neLng) };
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
        });
      }
    }

    const result = { markers };
    await cacheSet(`map:${cacheHash}`, result, 60);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
