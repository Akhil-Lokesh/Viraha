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
      data: capsules.map((c) => {
        // A capsule's content is only revealable once it has been opened or its
        // open date has passed. Sealed capsules (returned when includeSealed=true)
        // must never ship their letter text or precise coordinates to the client.
        const isRevealed = c.isOpened || c.openAt <= now;
        const base = {
          id: c.id,
          userId: c.userId,
          locationName: c.locationName,
          type: c.type,
          isOpened: c.isOpened,
          isOpenable: !c.isOpened && c.openAt <= now,
          sealedAt: c.sealedAt.toISOString(),
          openAt: c.openAt.toISOString(),
          openedAt: c.openedAt?.toISOString() || null,
          createdAt: c.createdAt.toISOString(),
        };

        if (!isRevealed) {
          return {
            ...base,
            content: null,
            locationLat: null,
            locationLng: null,
          };
        }

        return {
          ...base,
          content: c.content,
          locationLat: c.locationLat != null ? Number(c.locationLat) : null,
          locationLng: c.locationLng != null ? Number(c.locationLng) : null,
        };
      }),
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

    res.status(201).json({
      success: true,
      data: {
        ...capsule,
        locationLat: capsule.locationLat != null ? Number(capsule.locationLat) : null,
        locationLng: capsule.locationLng != null ? Number(capsule.locationLng) : null,
      },
    });
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

    // Idempotent open: if already opened, return the existing record without
    // overwriting the original openedAt timestamp.
    if (capsule.isOpened) {
      res.json({
        success: true,
        data: {
          ...capsule,
          locationLat: capsule.locationLat != null ? Number(capsule.locationLat) : null,
          locationLng: capsule.locationLng != null ? Number(capsule.locationLng) : null,
        },
      });
      return;
    }

    const updated = await prisma.timeCapsule.update({
      where: { id },
      data: { isOpened: true, openedAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        locationLat: updated.locationLat != null ? Number(updated.locationLat) : null,
        locationLng: updated.locationLng != null ? Number(updated.locationLng) : null,
      },
    });
  } catch (err) {
    next(err);
  }
}
