import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function handleGetWantToGo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;

    const items = await prisma.wantToGo.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateWantToGo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { locationLat, locationLng, locationName, locationCity, locationCountry, placeId, notes } = req.body;

    const item = await prisma.wantToGo.create({
      data: {
        userId,
        locationLat,
        locationLng,
        locationName,
        locationCity,
        locationCountry,
        placeId,
        notes,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateWantToGo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { notes, status } = req.body;

    const existing = await prisma.wantToGo.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    const updated = await prisma.wantToGo.update({
      where: { id },
      data: {
        ...(notes !== undefined ? { notes } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(status === 'visited' ? { visitedAt: new Date() } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteWantToGo(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.wantToGo.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    await prisma.wantToGo.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
