import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateCommentInput, UpdateCommentInput } from '../validators/commentValidators';
import { createActivity } from '../utils/activity';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    const userId = req.user!.userId;
    const { text, parentId } = req.body as CreateCommentInput;

    // Verify post exists and is not deleted
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    // If replying, verify parent comment exists
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parent || parent.isDeleted || parent.postId !== postId) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Parent comment not found' },
        });
        return;
      }
    }

    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: { postId, userId, text, parentId: parentId || null },
        include: { user: { select: userSelect } },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      }),
    ]);

    // Create activity for post owner (or parent comment owner for replies)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (parentComment) {
        await createActivity({
          userId: parentComment.userId,
          actorId: userId,
          type: 'reply',
          postId,
          commentId: comment.id,
        });
      }
    } else {
      await createActivity({
        userId: post.userId,
        actorId: userId,
        type: 'comment',
        postId,
        commentId: comment.id,
      });
    }

    res.status(201).json({ success: true, data: { comment } });
  } catch (err) {
    next(err);
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = req.params.postId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    // Verify post exists
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isDeleted: false },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: userSelect },
        _count: { select: { replies: { where: { isDeleted: false } } } },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map(({ _count, ...comment }) => ({
          ...comment,
          replyCount: _count.replies,
        })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getReplies(req: Request, res: Response, next: NextFunction) {
  try {
    const commentId = req.params.commentId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const replies = await prisma.comment.findMany({
      where: { parentId: commentId, isDeleted: false },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'asc' },
      include: { user: { select: userSelect } },
    });

    const hasMore = replies.length > limit;
    const items = hasMore ? replies.slice(0, limit) : replies;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: { items, nextCursor },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateComment(req: Request, res: Response, next: NextFunction) {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user!.userId;
    const { text } = req.body as UpdateCommentInput;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment || comment.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
      return;
    }

    if (comment.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own comments' },
      });
      return;
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
      include: { user: { select: userSelect } },
    });

    res.json({ success: true, data: { comment: updated } });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user!.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { userId: true } } },
    });

    if (!comment || comment.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Comment not found' },
      });
      return;
    }

    // Allow deletion by comment owner or post owner
    if (comment.userId !== userId && comment.post.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own comments' },
      });
      return;
    }

    await prisma.$transaction([
      prisma.comment.update({
        where: { id: commentId },
        data: { isDeleted: true },
      }),
      prisma.post.update({
        where: { id: comment.postId },
        data: { commentCount: { decrement: 1 } },
      }),
    ]);

    res.json({ success: true, data: { message: 'Comment deleted' } });
  } catch (err) {
    next(err);
  }
}
