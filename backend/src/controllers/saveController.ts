import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createActivity } from '../utils/activity';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function toggleSave(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    const userId = req.user!.userId;

    // Verify post exists and is not deleted
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    const existing = await prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // Unsave
      await prisma.$transaction([
        prisma.save.delete({ where: { id: existing.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { saveCount: { decrement: 1 } },
        }),
      ]);

      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        select: { saveCount: true },
      });

      res.json({
        success: true,
        data: { saved: false, saveCount: updatedPost!.saveCount },
      });
    } else {
      // Save
      await prisma.$transaction([
        prisma.save.create({ data: { userId, postId } }),
        prisma.post.update({
          where: { id: postId },
          data: { saveCount: { increment: 1 } },
        }),
      ]);

      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        select: { saveCount: true },
      });

      // Create activity for post owner
      await createActivity({
        userId: post.userId,
        actorId: userId,
        type: 'save',
        postId,
      });

      res.status(201).json({
        success: true,
        data: { saved: true, saveCount: updatedPost!.saveCount },
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function checkSaveStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    const userId = req.user!.userId;

    const save = await prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    res.json({ success: true, data: { saved: !!save } });
  } catch (err) {
    next(err);
  }
}

export async function getSavedPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const saves = await prisma.save.findMany({
      where: { userId, post: { isDeleted: false } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: { user: { select: userSelect } },
        },
      },
    });

    const hasMore = saves.length > limit;
    const items = hasMore ? saves.slice(0, limit) : saves;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map((s) => ({ ...s.post, savedAt: s.createdAt })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
