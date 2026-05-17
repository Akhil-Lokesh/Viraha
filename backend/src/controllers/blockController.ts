import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { invalidateBlockCacheFor } from '../lib/blocks';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function blockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const blockedId = req.params.userId as string;
    const blockerId = req.user!.userId;

    if (blockerId === blockedId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'You cannot block yourself' },
      });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: blockedId } });
    if (!target) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'User already blocked' },
      });
      return;
    }

    // Create block + tear down any existing follow relationship in either direction
    await prisma.$transaction([
      prisma.block.create({ data: { blockerId, blockedId } }),
      prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      }),
    ]);

    await invalidateBlockCacheFor(blockerId, blockedId);

    res.status(201).json({ success: true, data: { message: 'User blocked' } });
  } catch (err) {
    next(err);
  }
}

export async function unblockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const blockedId = req.params.userId as string;
    const blockerId = req.user!.userId;

    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User is not blocked' },
      });
      return;
    }

    await prisma.block.delete({ where: { id: existing.id } });
    await invalidateBlockCacheFor(blockerId, blockedId);

    res.json({ success: true, data: { message: 'User unblocked' } });
  } catch (err) {
    next(err);
  }
}

export async function getBlockedUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const blockerId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const rows = await prisma.block.findMany({
      where: { blockerId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: { blocked: { select: userSelect } },
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map((r) => ({
          id: r.id,
          createdAt: r.createdAt,
          user: r.blocked,
        })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
