import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { detectJourneys } from '../services/journeyDetector';

export async function handleGetJourneys(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;

    const journeys = await prisma.journey.findMany({
      where: {
        userId,
        isDeleted: false,
        ...(status ? { status } : {}),
      },
      orderBy: { startDate: 'desc' },
      include: {
        journeyPosts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            post: {
              select: {
                id: true,
                caption: true,
                mediaUrls: true,
                mediaThumbnails: true,
                locationName: true,
                locationCity: true,
                locationCountry: true,
                locationLat: true,
                locationLng: true,
                postedAt: true,
              },
            },
          },
        },
      },
    });

    res.json({ success: true, data: journeys });
  } catch (err) {
    next(err);
  }
}

export async function handleGetJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const journey = await prisma.journey.findFirst({
      where: { id, userId, isDeleted: false },
      include: {
        journeyPosts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            post: {
              select: {
                id: true,
                caption: true,
                mediaUrls: true,
                mediaThumbnails: true,
                locationName: true,
                locationCity: true,
                locationCountry: true,
                locationLat: true,
                locationLng: true,
                postedAt: true,
                tags: true,
              },
            },
          },
        },
      },
    });

    if (!journey) {
      res.status(404).json({ success: false, error: 'Journey not found' });
      return;
    }

    res.json({ success: true, data: journey });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { title, description, coverImage } = req.body;

    const journey = await prisma.journey.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!journey) {
      res.status(404).json({ success: false, error: 'Journey not found' });
      return;
    }

    const updated = await prisma.journey.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
        status: 'edited',
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleConfirmJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const journey = await prisma.journey.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!journey) {
      res.status(404).json({ success: false, error: 'Journey not found' });
      return;
    }

    const updated = await prisma.journey.update({
      where: { id },
      data: { status: 'confirmed' },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const journey = await prisma.journey.findFirst({
      where: { id, userId, isDeleted: false },
    });

    if (!journey) {
      res.status(404).json({ success: false, error: 'Journey not found' });
      return;
    }

    await prisma.journey.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleDetectJourneys(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const count = await detectJourneys(userId);
    res.json({ success: true, data: { journeysCreated: count } });
  } catch (err) {
    next(err);
  }
}
