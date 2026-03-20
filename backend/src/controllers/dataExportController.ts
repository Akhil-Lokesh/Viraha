import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

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
      res.status(400).json({ success: false, error: 'Username confirmation does not match' });
      return;
    }

    // Cascading delete handles most relations
    await prisma.user.delete({ where: { id: userId } });

    // Clear auth cookies
    res.clearCookie('viraha_access');
    res.clearCookie('viraha_refresh');

    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
}
