import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function handleGetTimeCapsules(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const includeSealed = req.query.includeSealed === 'true';

    const now = new Date();
    const capsules = await prisma.timeCapsule.findMany({
      where: {
        userId,
        ...(includeSealed ? {} : { OR: [{ isOpened: true }, { openAt: { lte: now } }] }),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mark newly openable capsules
    const newlyOpenable = capsules.filter((c) => !c.isOpened && c.openAt <= now);
    if (newlyOpenable.length > 0) {
      await prisma.timeCapsule.updateMany({
        where: { id: { in: newlyOpenable.map((c) => c.id) } },
        data: { isOpened: true, openedAt: now },
      });
    }

    res.json({
      success: true,
      data: capsules.map((c) => ({
        ...c,
        isOpenable: !c.isOpened && c.openAt <= now,
        sealedAt: c.sealedAt.toISOString(),
        openAt: c.openAt.toISOString(),
        openedAt: c.openedAt?.toISOString() || null,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateTimeCapsule(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { content, locationName, locationLat, locationLng, type, openAt } = req.body;

    const capsule = await prisma.timeCapsule.create({
      data: {
        userId,
        content,
        locationName,
        locationLat,
        locationLng,
        type: type || 'departure',
        openAt: new Date(openAt),
      },
    });

    res.status(201).json({ success: true, data: capsule });
  } catch (err) {
    next(err);
  }
}

export async function handleOpenTimeCapsule(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const capsule = await prisma.timeCapsule.findFirst({ where: { id, userId } });
    if (!capsule) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    if (capsule.openAt > new Date()) {
      res.status(403).json({ success: false, error: 'This capsule is not ready to open yet' });
      return;
    }

    const updated = await prisma.timeCapsule.update({
      where: { id },
      data: { isOpened: true, openedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
