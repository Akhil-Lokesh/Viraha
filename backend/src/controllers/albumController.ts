import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateAlbumInput, UpdateAlbumInput, AddPostToAlbumInput } from '../validators/albumValidators';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 200);
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

export async function createAlbum(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateAlbumInput;
    const userId = req.user!.userId;

    const slug = generateSlug(data.title);

    const album = await prisma.album.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        privacy: data.privacy,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        slug,
      },
      include: { user: { select: userSelect } },
    });

    res.status(201).json({ success: true, data: { album } });
  } catch (err) {
    next(err);
  }
}

export async function getAlbums(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;
    const userId = req.query.userId as string | undefined;

    const where: any = { isDeleted: false };

    if (userId) {
      where.userId = userId;
    }

    if (req.user) {
      const follows = await prisma.follow.findMany({
        where: { followerId: req.user.userId, status: 'accepted' },
        select: { followingId: true },
      });
      const followedIds = follows.map((f) => f.followingId);

      where.OR = [
        { privacy: 'public' },
        { privacy: 'followers', userId: { in: followedIds } },
        { userId: req.user.userId },
      ];
    } else {
      where.privacy = 'public';
    }

    const albums = await prisma.album.findMany({
      where,
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: userSelect } },
    });

    const hasMore = albums.length > limit;
    const items = hasMore ? albums.slice(0, limit) : albums;
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

export async function getAlbumById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        user: { select: userSelect },
        albumPosts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            post: {
              include: { user: { select: userSelect } },
            },
          },
        },
      },
    });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== req.user?.userId) {
      if (album.privacy === 'private') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
        return;
      }
      if (album.privacy === 'followers') {
        if (!req.user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: album.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
      }
    }

    // Filter out soft-deleted posts from album
    const filteredAlbum = {
      ...album,
      albumPosts: album.albumPosts.filter((ap) => !ap.post.isDeleted),
    };

    res.json({ success: true, data: { album: filteredAlbum } });
  } catch (err) {
    next(err);
  }
}

export async function getAlbumBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;

    const album = await prisma.album.findUnique({
      where: { slug },
      include: {
        user: { select: userSelect },
        albumPosts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            post: {
              include: { user: { select: userSelect } },
            },
          },
        },
      },
    });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== req.user?.userId) {
      if (album.privacy === 'private') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
        return;
      }
      if (album.privacy === 'followers') {
        if (!req.user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: album.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
      }
    }

    // Filter out soft-deleted posts from album
    const filteredAlbum = {
      ...album,
      albumPosts: album.albumPosts.filter((ap) => !ap.post.isDeleted),
    };

    res.json({ success: true, data: { album: filteredAlbum } });
  } catch (err) {
    next(err);
  }
}

export async function updateAlbum(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const album = await prisma.album.findUnique({ where: { id } });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own albums' },
      });
      return;
    }

    const data = req.body as UpdateAlbumInput;

    const updated = await prisma.album.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title, slug: generateSlug(data.title) }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.privacy !== undefined && { privacy: data.privacy }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      },
      include: { user: { select: userSelect } },
    });

    res.json({ success: true, data: { album: updated } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAlbum(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const album = await prisma.album.findUnique({ where: { id } });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own albums' },
      });
      return;
    }

    await prisma.album.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true, data: { message: 'Album deleted' } });
  } catch (err) {
    next(err);
  }
}

export async function addPostToAlbum(req: Request, res: Response, next: NextFunction) {
  try {
    const albumId = req.params.id as string;
    const { postId } = req.body as AddPostToAlbumInput;
    const userId = req.user!.userId;

    const album = await prisma.album.findUnique({ where: { id: albumId } });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only add posts to your own albums' },
      });
      return;
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found' },
      });
      return;
    }

    // Determine sort order (append to end)
    const lastAlbumPost = await prisma.albumPost.findFirst({
      where: { albumId },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = lastAlbumPost ? lastAlbumPost.sortOrder + 1 : 0;

    // Auto-set cover image if album has none
    const updateData: any = { postCount: { increment: 1 } };
    if (!album.coverImage && post.mediaUrls.length > 0) {
      updateData.coverImage = post.mediaUrls[0];
    }

    const [albumPost] = await prisma.$transaction([
      prisma.albumPost.create({
        data: {
          albumId,
          postId,
          sortOrder,
        },
        include: {
          post: {
            include: { user: { select: userSelect } },
          },
        },
      }),
      prisma.album.update({
        where: { id: albumId },
        data: updateData,
      }),
    ]);

    res.status(201).json({ success: true, data: { albumPost } });
  } catch (err) {
    next(err);
  }
}

export async function removePostFromAlbum(req: Request, res: Response, next: NextFunction) {
  try {
    const albumId = req.params.id as string;
    const postId = req.params.postId as string;
    const userId = req.user!.userId;

    const album = await prisma.album.findUnique({ where: { id: albumId } });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only remove posts from your own albums' },
      });
      return;
    }

    const albumPost = await prisma.albumPost.findUnique({
      where: { albumId_postId: { albumId, postId } },
    });

    if (!albumPost) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Post not found in album' },
      });
      return;
    }

    await prisma.$transaction([
      prisma.albumPost.delete({ where: { id: albumPost.id } }),
      prisma.album.update({
        where: { id: albumId },
        data: {
          postCount: { decrement: album.postCount > 0 ? 1 : 0 },
        },
      }),
    ]);

    res.json({ success: true, data: { message: 'Post removed from album' } });
  } catch (err) {
    next(err);
  }
}

export async function getAlbumPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const albumId = req.params.id as string;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;

    const album = await prisma.album.findUnique({ where: { id: albumId } });

    if (!album || album.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Album not found' },
      });
      return;
    }

    if (album.userId !== req.user?.userId) {
      if (album.privacy === 'private') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
        return;
      }
      if (album.privacy === 'followers') {
        if (!req.user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: album.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Album not found' } });
          return;
        }
      }
    }

    const albumPosts = await prisma.albumPost.findMany({
      where: { albumId, post: { isDeleted: false } },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { sortOrder: 'asc' },
      include: {
        post: {
          include: { user: { select: userSelect } },
        },
      },
    });

    const hasMore = albumPosts.length > limit;
    const items = hasMore ? albumPosts.slice(0, limit) : albumPosts;
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
