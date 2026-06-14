import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { createActivity } from '../utils/activity';
import { isBlockedBetween } from '../lib/blocks';

const LIKE_TYPE = 'like';

async function canViewPost(viewerId: string, post: { userId: string; privacy: string }): Promise<boolean> {
  if (post.userId === viewerId) return true;
  // If either side has blocked the other, the post is not viewable (mirrors commentController).
  if (await isBlockedBetween(viewerId, post.userId)) return false;
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

    const existing = await prisma.reaction.findUnique({
      where: { userId_postId_type: { userId, postId, type: LIKE_TYPE } },
    });

    // Unlike: removing your OWN reaction is always allowed — even if a block or
    // privacy change happened after the like — so the row and the denormalized
    // likeCount never get orphaned. GREATEST clamps at 0 so a concurrent unlike
    // can never push like_count negative (which would violate the CHECK constraint).
    if (existing) {
      try {
        await prisma.$transaction([
          prisma.reaction.delete({ where: { id: existing.id } }),
          prisma.$executeRaw`UPDATE "posts" SET "like_count" = GREATEST("like_count" - 1, 0) WHERE "id" = ${postId}::uuid`,
        ]);
      } catch (txErr) {
        // Concurrent unlike already removed the row (P2025): treat as success and
        // skip the decrement so the count isn't double-counted (mirrors saveController).
        if (
          txErr instanceof Prisma.PrismaClientKnownRequestError &&
          txErr.code === 'P2025'
        ) {
          const current = await prisma.post.findUnique({
            where: { id: postId },
            select: { likeCount: true },
          });
          res.json({
            success: true,
            data: { liked: false, likeCount: Math.max(0, current?.likeCount ?? 0) },
          });
          return;
        }
        throw txErr;
      }

      const updated = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });
      res.json({
        success: true,
        data: { liked: false, likeCount: Math.max(0, updated?.likeCount ?? 0) },
      });
      return;
    }

    // Like (create) is gated by block + privacy — you can only like a post you may view.
    if (!(await canViewPost(userId, post))) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
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
