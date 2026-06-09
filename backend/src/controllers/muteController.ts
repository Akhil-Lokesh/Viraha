import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { invalidateMuteCacheFor } from '../lib/blocks';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

/**
 * POST /api/v1/users/:username/mute
 * One-way, idempotent. The muted user is never notified and can't tell.
 */
export async function muteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.params.username as string;
    const muterId = req.user!.userId;

    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    if (target.id === muterId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'You cannot mute yourself' },
      });
      return;
    }

    // Idempotent: re-muting an already-muted user is a no-op success.
    await prisma.mute.upsert({
      where: { muterId_mutedId: { muterId, mutedId: target.id } },
      create: { muterId, mutedId: target.id },
      update: {},
    });

    await invalidateMuteCacheFor(muterId);

    res.json({ success: true, data: { message: 'User muted' } });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/users/:username/mute
 * Idempotent: unmuting a user who isn't muted still succeeds.
 */
export async function unmuteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.params.username as string;
    const muterId = req.user!.userId;

    const target = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    await prisma.mute.deleteMany({
      where: { muterId, mutedId: target.id },
    });

    await invalidateMuteCacheFor(muterId);

    res.json({ success: true, data: { message: 'User unmuted' } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/users/me/muted
 */
export async function getMutedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const muterId = req.user!.userId;

    const rows = await prisma.mute.findMany({
      where: { muterId },
      orderBy: { createdAt: 'desc' },
      include: { muted: { select: userSelect } },
    });

    res.json({
      success: true,
      data: {
        users: rows.map((r) => ({
          id: r.muted.id,
          username: r.muted.username,
          displayName: r.muted.displayName,
          avatar: r.muted.avatar,
          mutedAt: r.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
