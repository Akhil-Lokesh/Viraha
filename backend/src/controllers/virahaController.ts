import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
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
    // Body is validated by upsertPlaceNoteSchema in the route middleware.
    const { locationLat, locationLng, locationName, locationCity, locationCountry, placeId, note } =
      req.body as {
        locationLat: number;
        locationLng: number;
        locationName?: string | null;
        locationCity?: string | null;
        locationCountry?: string | null;
        placeId?: string | null;
        note: string;
      };

    // Find an existing note for this place. With a stable placeId, the
    // @@unique([userId, placeId]) key dedupes reliably; without one, Postgres
    // treats NULL placeIds as distinct, so the constraint is ineffective and we
    // fall back to coordinate-proximity matching plus a transaction to close the
    // check-then-create race that would otherwise create duplicate null-placeId rows.
    const findExisting = (tx: Prisma.TransactionClient) =>
      placeId
        ? tx.placeNote.findUnique({ where: { userId_placeId: { userId, placeId } } })
        : tx.placeNote.findFirst({
            where: {
              userId,
              placeId: null,
              locationLat: { gte: locationLat - 0.001, lte: locationLat + 0.001 },
              locationLng: { gte: locationLng - 0.001, lte: locationLng + 0.001 },
            },
          });

    const upsert = async (): Promise<Prisma.PlaceNoteGetPayload<object>> =>
      prisma.$transaction(
        async (tx) => {
          const existing = await findExisting(tx);
          if (existing) {
            return tx.placeNote.update({
              where: { id: existing.id },
              data: { note },
            });
          }
          return tx.placeNote.create({
            data: {
              userId,
              locationLat,
              locationLng,
              locationName: locationName ?? null,
              locationCity: locationCity ?? null,
              locationCountry: locationCountry ?? null,
              placeId: placeId ?? null,
              note,
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

    let result: Prisma.PlaceNoteGetPayload<object>;
    try {
      result = await upsert();
    } catch (txErr: unknown) {
      // Concurrent request created the row first (P2002 on the stable-placeId
      // unique key). Re-run: the existing row will now be found and updated.
      if (
        txErr instanceof Prisma.PrismaClientKnownRequestError &&
        txErr.code === 'P2002'
      ) {
        result = await upsert();
      } else {
        throw txErr;
      }
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
