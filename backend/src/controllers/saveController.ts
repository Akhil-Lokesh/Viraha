import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { createActivity } from '../utils/activity';
import { redactPostLocation } from '../utils/locationPrivacy';
import { isBlockedBetween } from '../lib/blocks';

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

    // Privacy + block gate: you can only save a post you are allowed to view.
    // Present 404 (not 403) so existence isn't leaked. Mirrors reactionController/commentController.
    if (post.userId !== userId) {
      const blocked = await isBlockedBetween(userId, post.userId);
      const hiddenByPrivacy =
        post.privacy === 'private' ||
        (post.privacy === 'followers' &&
          !(await prisma.follow.findFirst({
            where: { followerId: userId, followingId: post.userId, status: 'accepted' },
            select: { id: true },
          })));
      if (blocked || hiddenByPrivacy) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Post not found' },
        });
        return;
      }
    }

    const existing = await prisma.save.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // Unsave
      try {
        await prisma.$transaction([
          prisma.save.delete({ where: { id: existing.id } }),
          prisma.post.update({
            where: { id: postId },
            data: { saveCount: { decrement: 1 } },
          }),
        ]);
      } catch (txErr) {
        // Concurrent unsave already removed the row (P2025): treat as success.
        // Skip the count decrement so it isn't double-counted.
        if (
          txErr instanceof Prisma.PrismaClientKnownRequestError &&
          txErr.code === 'P2025'
        ) {
          res.json({ success: true, data: { saved: false } });
          return;
        }
        throw txErr;
      }

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
      try {
        await prisma.$transaction([
          prisma.save.create({ data: { userId, postId } }),
          prisma.post.update({
            where: { id: postId },
            data: { saveCount: { increment: 1 } },
          }),
        ]);
      } catch (txErr) {
        // Concurrent save already created the row (P2002 unique violation):
        // treat as success. Skip the count increment so it isn't double-counted.
        if (
          txErr instanceof Prisma.PrismaClientKnownRequestError &&
          txErr.code === 'P2002'
        ) {
          res.json({ success: true, data: { saved: true } });
          return;
        }
        throw txErr;
      }

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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
        // Saving someone's location-private post must not reveal its exact
        // coordinates — redact unless the viewer owns the post.
        items: items.map((s) => ({
          ...redactPostLocation(s.post, userId),
          isSaved: true,
          savedAt: s.createdAt,
        })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}
