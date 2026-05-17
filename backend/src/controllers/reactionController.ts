import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createActivity } from '../utils/activity';

const LIKE_TYPE = 'like';

async function canViewPost(viewerId: string, post: { userId: string; privacy: string }): Promise<boolean> {
  if (post.userId === viewerId) return true;
  if (post.privacy === 'public') return true;
  if (post.privacy === 'followers') {
    const follow = await prisma.follow.findFirst({
      where: { followerId: viewerId, followingId: post.userId, status: 'accepted' },
      select: { id: true },
    });
    return !!follow;
  }
  return false;
}

export async function toggleLike(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    const userId = req.user!.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true, privacy: true, isDeleted: true },
    });

    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    if (!(await canViewPost(userId, post))) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    const existing = await prisma.reaction.findUnique({
      where: { userId_postId_type: { userId, postId, type: LIKE_TYPE } },
    });

    if (existing) {
      const [, updated] = await prisma.$transaction([
        prisma.reaction.delete({ where: { id: existing.id } }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);

      res.json({
        success: true,
        data: { liked: false, likeCount: Math.max(0, updated.likeCount) },
      });
      return;
    }

    const [, updated] = await prisma.$transaction([
      prisma.reaction.create({ data: { userId, postId, type: LIKE_TYPE } }),
      prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);

    await createActivity({
      userId: post.userId,
      actorId: userId,
      type: 'like',
      postId,
    });

    res.status(201).json({
      success: true,
      data: { liked: true, likeCount: updated.likeCount },
    });
  } catch (err) {
    next(err);
  }
}
