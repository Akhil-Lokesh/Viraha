import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { clearAuthCookies } from '../utils/cookies';

export async function handleExportData(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const [user, posts, journals, albums, saves, follows, placeNotes, wantToGo, timeCapsules, scrapbooks] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true, email: true, displayName: true, bio: true,
          homeCity: true, homeCountry: true, createdAt: true,
        },
      }),
      prisma.post.findMany({
        where: { userId, isDeleted: false },
        select: {
          id: true, caption: true, mediaUrls: true, locationName: true,
          locationCity: true, locationCountry: true, locationLat: true,
          locationLng: true, tags: true, postedAt: true, privacy: true,
        },
      }),
      prisma.journal.findMany({
        where: { userId, isDeleted: false },
        include: {
          entries: {
            where: { isDeleted: false },
            select: {
              id: true, title: true, content: true, date: true,
              locationName: true, mood: true, mediaUrls: true,
            },
          },
        },
      }),
      prisma.album.findMany({
        where: { userId, isDeleted: false },
        include: { albumPosts: { include: { post: { select: { id: true, caption: true, mediaUrls: true } } } } },
      }),
      prisma.save.findMany({
        where: { userId },
        include: { post: { select: { id: true, caption: true, locationName: true } } },
      }),
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { username: true } } },
      }),
      prisma.placeNote.findMany({ where: { userId } }),
      prisma.wantToGo.findMany({ where: { userId } }),
      prisma.timeCapsule.findMany({ where: { userId } }),
      prisma.scrapbook.findMany({
        where: { userId },
        include: { items: true },
      }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user,
      posts: posts.map((p) => ({
        ...p,
        locationLat: Number(p.locationLat),
        locationLng: Number(p.locationLng),
      })),
      journals: journals.map((j) => ({
        id: j.id, title: j.title, summary: j.summary, privacy: j.privacy,
        status: j.status, entries: j.entries,
      })),
      albums: albums.map((a) => ({
        id: a.id, title: a.title, description: a.description,
        posts: a.albumPosts.map((ap) => ap.post),
      })),
      savedPosts: saves.map((s) => s.post),
      following: follows.map((f) => f.following.username),
      placeNotes,
      wantToGo,
      timeCapsules: timeCapsules.map((tc) => ({
        ...tc,
        locationLat: tc.locationLat ? Number(tc.locationLat) : null,
        locationLng: tc.locationLng ? Number(tc.locationLng) : null,
      })),
      scrapbooks,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="viraha-export-${user?.username || 'data'}.json"`);
    res.json(exportData);
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { confirmUsername } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
    if (!user || user.username !== confirmUsername) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Username confirmation does not match' },
      });
      return;
    }

    // Cascade delete removes the user's Save/Comment rows but does NOT adjust the
    // denormalized saveCount/commentCount on other users' posts, so those counters
    // drift permanently. Decrement them (grouped by postId, floored at 0) inside the
    // same transaction as the user delete so counts and rows stay consistent.
    await prisma.$transaction(async (tx) => {
      const [savesByPost, commentsByPost] = await Promise.all([
        tx.save.groupBy({
          by: ['postId'],
          where: { userId },
          _count: { postId: true },
        }),
        tx.comment.groupBy({
          by: ['postId'],
          where: { userId, isDeleted: false },
          _count: { postId: true },
        }),
      ]);

      const postIds = Array.from(
        new Set([
          ...savesByPost.map((g) => g.postId),
          ...commentsByPost.map((g) => g.postId),
        ]),
      );

      if (postIds.length > 0) {
        const saveDeltaByPost = new Map(savesByPost.map((g) => [g.postId, g._count.postId]));
        const commentDeltaByPost = new Map(commentsByPost.map((g) => [g.postId, g._count.postId]));

        const posts = await tx.post.findMany({
          where: { id: { in: postIds } },
          select: { id: true, saveCount: true, commentCount: true },
        });

        // set() with a floored value (rather than decrement()) guarantees counters
        // never go negative even if they were already out of sync.
        await Promise.all(
          posts.map((post) =>
            tx.post.update({
              where: { id: post.id },
              data: {
                saveCount: Math.max(0, post.saveCount - (saveDeltaByPost.get(post.id) ?? 0)),
                commentCount: Math.max(0, post.commentCount - (commentDeltaByPost.get(post.id) ?? 0)),
              },
            }),
          ),
        );
      }

      // Cascading delete handles the remaining relations.
      await tx.user.delete({ where: { id: userId } });
    });

    // Clear auth cookies
    clearAuthCookies(res);

    res.json({ success: true, data: { message: 'Account deleted' } });
  } catch (err) {
    next(err);
  }
}
