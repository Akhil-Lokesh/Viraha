import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { createActivity } from '../utils/activity';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    const followingId = req.params.userId as string;
    const followerId = req.user!.userId;

    if (followerId === followingId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'You cannot follow yourself' },
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
    if (!targetUser) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Already following this user' },
      });
      return;
    }

    // If target user is private, create pending follow
    const status = targetUser.isPrivate ? 'pending' : 'accepted';

    const follow = await prisma.follow.create({
      data: { followerId, followingId, status },
    });

    // Create activity for the followed user
    await createActivity({
      userId: followingId,
      actorId: followerId,
      type: status === 'pending' ? 'follow_request' : 'follow',
    });

    res.status(201).json({ success: true, data: { follow } });
  } catch (err) {
    next(err);
  }
}

export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    const followingId = req.params.userId as string;
    const followerId = req.user!.userId;

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!follow) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Not following this user' },
      });
      return;
    }

    await prisma.follow.delete({
      where: { id: follow.id },
    });

    res.json({ success: true, data: { message: 'Unfollowed successfully' } });
  } catch (err) {
    next(err);
  }
}

export async function getFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const follows = await prisma.follow.findMany({
      where: { followingId: userId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { follower: { select: userSelect } },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map((f) => f.follower),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { following: { select: userSelect } },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map((f) => f.following),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptFollowRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const followId = req.params.followId as string;
    const userId = req.user!.userId;

    const follow = await prisma.follow.findUnique({ where: { id: followId } });

    if (!follow || follow.followingId !== userId || follow.status !== 'pending') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Follow request not found' },
      });
      return;
    }

    await prisma.follow.update({
      where: { id: followId },
      data: { status: 'accepted' },
    });

    await createActivity({
      userId: follow.followerId,
      actorId: userId,
      type: 'follow_accepted',
    });

    res.json({ success: true, data: { message: 'Follow request accepted' } });
  } catch (err) {
    next(err);
  }
}

export async function rejectFollowRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const followId = req.params.followId as string;
    const userId = req.user!.userId;

    const follow = await prisma.follow.findUnique({ where: { id: followId } });

    if (!follow || follow.followingId !== userId || follow.status !== 'pending') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Follow request not found' },
      });
      return;
    }

    await prisma.follow.delete({ where: { id: followId } });

    res.json({ success: true, data: { message: 'Follow request rejected' } });
  } catch (err) {
    next(err);
  }
}

export async function getPendingRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const follows = await prisma.follow.findMany({
      where: { followingId: userId, status: 'pending' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { follower: { select: userSelect } },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items: items.map((f) => ({ ...f.follower, followId: f.id })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function checkFollowStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const followingId = req.params.userId as string;
    const followerId = req.user!.userId;

    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    res.json({
      success: true,
      data: {
        isFollowing: !!follow && follow.status === 'accepted',
        isPending: !!follow && follow.status === 'pending',
      },
    });
  } catch (err) {
    next(err);
  }
}
