import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function getActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const activities = await prisma.activity.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: userSelect },
        post: {
          select: {
            id: true,
            caption: true,
            mediaUrls: true,
            mediaThumbnails: true,
            locationName: true,
          },
        },
        comment: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: { items, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const activityId = req.params.id as string;
    const userId = req.user!.userId;

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity || activity.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Activity not found' },
      });
      return;
    }

    await prisma.activity.update({
      where: { id: activityId },
      data: { read: true },
    });

    res.json({ success: true, data: { message: 'Marked as read' } });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    await prisma.activity.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    res.json({ success: true, data: { message: 'All marked as read' } });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const count = await prisma.activity.count({
      where: { userId, read: false },
    });

    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}
