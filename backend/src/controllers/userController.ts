import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { UpdateProfileInput } from '../validators/userValidators';

export async function getUserByUsername(req: Request, res: Response, next: NextFunction) {
  try {
    const username = req.params.username as string;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        homeCity: true,
        homeCountry: true,
        isPrivate: true,
        createdAt: true,
        _count: {
          select: {
            posts: { where: { isDeleted: false, privacy: 'public' } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    let isFollowing = false;
    if (req.user) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.userId,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    const { _count, ...rest } = user;
    res.json({
      success: true,
      data: {
        user: {
          ...rest,
          postCount: _count.posts,
          followerCount: _count.followers,
          followingCount: _count.following,
          isFollowing,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    if (!q) {
      res.json({ success: true, data: { users: [] } });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        homeCity: true,
        homeCountry: true,
        _count: {
          select: {
            posts: { where: { isDeleted: false, privacy: 'public' } },
            followers: true,
          },
        },
      },
    });

    const items = users.map(({ _count, ...u }) => ({
      ...u,
      postCount: _count.posts,
      followerCount: _count.followers,
    }));

    res.json({ success: true, data: { users: items } });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as UpdateProfileInput;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: {
        id: true, username: true, email: true, displayName: true,
        bio: true, avatar: true, homeCity: true, homeCountry: true,
        homeLat: true, homeLng: true, isPrivate: true, showLocation: true,
        emailVerified: true, isActive: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
      },
    });

    const sanitized = user;

    res.json({ success: true, data: { user: sanitized } });
  } catch (err) {
    next(err);
  }
}
