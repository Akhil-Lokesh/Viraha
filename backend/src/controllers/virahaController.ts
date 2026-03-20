import { Request, Response, NextFunction } from 'express';
import {
  getOnThisDay,
  getMoments,
  getPlaceHistory,
  getPlaceResonance,
} from '../services/virahaEngine';
import { prisma } from '../lib/prisma';

export async function handleGetOnThisDay(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const items = await getOnThisDay(userId);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMoments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const moments = await getMoments(userId);
    res.json({ success: true, data: moments });
  } catch (err) {
    next(err);
  }
}

export async function handleDismissMoment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    await prisma.virahaMoment.updateMany({
      where: { id, userId },
      data: { dismissed: true },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPlaceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 0.01;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'lat and lng are required' });
      return;
    }

    const history = await getPlaceHistory(userId, lat, lng, radius);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPlaceResonance(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const places = await getPlaceResonance(userId);
    res.json({ success: true, data: places });
  } catch (err) {
    next(err);
  }
}

export async function handleGetPlaceNote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius) || 0.01;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ success: false, error: 'lat and lng are required' });
      return;
    }

    const note = await prisma.placeNote.findFirst({
      where: {
        userId,
        locationLat: { gte: lat - radius, lte: lat + radius },
        locationLng: { gte: lng - radius, lte: lng + radius },
      },
    });

    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

export async function handleUpsertPlaceNote(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { locationLat, locationLng, locationName, locationCity, locationCountry, placeId, note } = req.body;

    const existing = placeId
      ? await prisma.placeNote.findUnique({ where: { userId_placeId: { userId, placeId } } })
      : await prisma.placeNote.findFirst({
          where: {
            userId,
            locationLat: { gte: locationLat - 0.001, lte: locationLat + 0.001 },
            locationLng: { gte: locationLng - 0.001, lte: locationLng + 0.001 },
          },
        });

    let result;
    if (existing) {
      result = await prisma.placeNote.update({
        where: { id: existing.id },
        data: { note },
      });
    } else {
      result = await prisma.placeNote.create({
        data: {
          userId,
          locationLat,
          locationLng,
          locationName,
          locationCity,
          locationCountry,
          placeId,
          note,
        },
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
