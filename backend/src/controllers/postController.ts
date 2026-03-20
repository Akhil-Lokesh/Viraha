import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { deleteFile } from '../lib/storage';
import { CreatePostInput, UpdatePostInput } from '../validators/postValidators';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const where: any = { isDeleted: false, privacy: 'public' };

    // If authenticated, also include the user's own posts
    if (req.user) {
      where.OR = [
        { privacy: 'public' },
        { userId: req.user.userId },
      ];
      delete where.privacy;
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { postedAt: 'desc' },
      include: { user: { select: userSelect } },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({
      success: true,
      data: {
        items,
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({
      where: { id },
      include: { user: { select: userSelect } },
    });

    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    // Check privacy
    if (post.privacy !== 'public' && post.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    res.json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreatePostInput;

    const post = await prisma.post.create({
      data: {
        userId: req.user!.userId,
        caption: data.caption,
        mediaUrls: data.mediaUrls,
        mediaThumbnails: data.mediaThumbnails || data.mediaUrls,
        locationLat: data.locationLat,
        locationLng: data.locationLng,
        locationName: data.locationName,
        locationCity: data.locationCity,
        locationCountry: data.locationCountry,
        placeId: data.placeId,
        takenAt: data.takenAt ? new Date(data.takenAt) : null,
        privacy: data.privacy,
        tags: data.tags || [],
        travelMode: data.travelMode,
      },
      include: { user: { select: userSelect } },
    });

    res.status(201).json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    if (post.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own posts' },
      });
      return;
    }

    const data = req.body as UpdatePostInput;

    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.privacy !== undefined && { privacy: data.privacy }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
      include: { user: { select: userSelect } },
    });

    res.json({ success: true, data: { post: updated } });
  } catch (err) {
    next(err);
  }
}

export async function searchPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const q = (req.query.q as string || '').trim();
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    if (!q) {
      res.json({ success: true, data: { items: [], nextCursor: null } });
      return;
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        privacy: 'public',
        OR: [
          { caption: { contains: q, mode: 'insensitive' } },
          { locationName: { contains: q, mode: 'insensitive' } },
          { locationCity: { contains: q, mode: 'insensitive' } },
          { locationCountry: { contains: q, mode: 'insensitive' } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { postedAt: 'desc' },
      include: { user: { select: userSelect } },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    let savedPostIds = new Set<string>();
    if (req.user) {
      const postIds = items.map((p) => p.id);
      const saves = await prisma.save.findMany({
        where: { userId: req.user.userId, postId: { in: postIds } },
        select: { postId: true },
      });
      savedPostIds = new Set(saves.map((s) => s.postId));
    }

    res.json({
      success: true,
      data: {
        items: items.map((post) => ({
          ...post,
          isSaved: savedPostIds.has(post.id),
        })),
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    if (post.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own posts' },
      });
      return;
    }

    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Delete associated media files (fire-and-forget)
    const allUrls = [...post.mediaUrls, ...post.mediaThumbnails];
    Promise.allSettled(allUrls.map((url) => deleteFile(url))).catch(() => {});

    res.json({ success: true, data: { message: 'Post deleted' } });
  } catch (err) {
    next(err);
  }
}
