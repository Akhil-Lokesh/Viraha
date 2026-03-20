import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { CreateJournalInput, UpdateJournalInput, CreateJournalEntryInput, UpdateJournalEntryInput } from '../validators/journalValidators';

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

export async function createJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const data = req.body as CreateJournalInput;
    const userId = req.user!.userId;
    const slug = generateSlug(data.title);

    const journal = await prisma.journal.create({
      data: {
        userId,
        title: data.title,
        summary: data.summary,
        coverImage: data.coverImage,
        privacy: data.privacy,
        status: data.status,
        slug,
      },
      include: { user: { select: userSelect } },
    });

    res.status(201).json({ success: true, data: { journal } });
  } catch (err) {
    next(err);
  }
}

export async function getJournals(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor as string | undefined;
    const userId = req.query.userId as string | undefined;

    const where: any = { isDeleted: false };

    if (userId) {
      where.userId = userId;
    }

    if (req.user) {
      where.OR = [
        { privacy: 'public', status: 'published' },
        { userId: req.user.userId },
      ];
    } else {
      where.privacy = 'public';
      where.status = 'published';
    }

    const journals = await prisma.journal.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { user: { select: userSelect } },
    });

    const hasMore = journals.length > limit;
    const items = hasMore ? journals.slice(0, limit) : journals;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({ success: true, data: { items, nextCursor } });
  } catch (err) {
    next(err);
  }
}

export async function getJournalById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        user: { select: userSelect },
        entries: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.privacy !== 'public' && journal.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.status === 'draft' && journal.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    res.json({ success: true, data: { journal } });
  } catch (err) {
    next(err);
  }
}

export async function getJournalBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = req.params.slug as string;

    const journal = await prisma.journal.findUnique({
      where: { slug },
      include: {
        user: { select: userSelect },
        entries: {
          where: { isDeleted: false },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.privacy !== 'public' && journal.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.status === 'draft' && journal.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    res.json({ success: true, data: { journal } });
  } catch (err) {
    next(err);
  }
}

export async function updateJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const journal = await prisma.journal.findUnique({ where: { id } });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only edit your own journals' },
      });
      return;
    }

    const data = req.body as UpdateJournalInput;

    const updated = await prisma.journal.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title, slug: generateSlug(data.title) }),
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.privacy !== undefined && { privacy: data.privacy }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: { user: { select: userSelect } },
    });

    res.json({ success: true, data: { journal: updated } });
  } catch (err) {
    next(err);
  }
}

export async function deleteJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const journal = await prisma.journal.findUnique({ where: { id } });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.userId !== req.user!.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only delete your own journals' },
      });
      return;
    }

    await prisma.journal.update({
      where: { id },
      data: { isDeleted: true },
    });

    res.json({ success: true, data: { message: 'Journal deleted' } });
  } catch (err) {
    next(err);
  }
}

// ── Journal Entries ──────────────────────────────────

export async function createEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const journalId = req.params.id as string;
    const userId = req.user!.userId;
    const data = req.body as CreateJournalEntryInput;

    const journal = await prisma.journal.findUnique({ where: { id: journalId } });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You can only add entries to your own journals' },
      });
      return;
    }

    const lastEntry = await prisma.journalEntry.findFirst({
      where: { journalId },
      orderBy: { sortOrder: 'desc' },
    });
    const sortOrder = lastEntry ? lastEntry.sortOrder + 1 : 0;

    const updateData: any = { entryCount: { increment: 1 } };
    if (!journal.coverImage && data.mediaUrls && data.mediaUrls.length > 0) {
      updateData.coverImage = data.mediaUrls[0];
    }

    const [entry] = await prisma.$transaction([
      prisma.journalEntry.create({
        data: {
          journalId,
          date: data.date ? new Date(data.date) : null,
          title: data.title,
          content: data.content,
          mediaUrls: data.mediaUrls || [],
          mood: data.mood,
          locationLat: data.locationLat,
          locationLng: data.locationLng,
          locationName: data.locationName,
          locationCity: data.locationCity,
          locationCountry: data.locationCountry,
          sortOrder,
        },
      }),
      prisma.journal.update({
        where: { id: journalId },
        data: updateData,
      }),
    ]);

    res.status(201).json({ success: true, data: { entry } });
  } catch (err) {
    next(err);
  }
}

export async function getEntries(req: Request, res: Response, next: NextFunction) {
  try {
    const journalId = req.params.id as string;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const journal = await prisma.journal.findUnique({ where: { id: journalId } });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.privacy !== 'public' && journal.userId !== req.user?.userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    const entries = await prisma.journalEntry.findMany({
      where: { journalId, isDeleted: false },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { sortOrder: 'asc' },
    });

    const hasMore = entries.length > limit;
    const items = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    res.json({ success: true, data: { items, nextCursor } });
  } catch (err) {
    next(err);
  }
}

export async function updateEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const journalId = req.params.id as string;
    const entryId = req.params.entryId as string;
    const userId = req.user!.userId;

    const journal = await prisma.journal.findUnique({ where: { id: journalId } });

    if (!journal || journal.isDeleted || journal.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    const entry = await prisma.journalEntry.findUnique({ where: { id: entryId } });

    if (!entry || entry.isDeleted || entry.journalId !== journalId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Entry not found' },
      });
      return;
    }

    const data = req.body as UpdateJournalEntryInput;

    const updated = await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        ...(data.date !== undefined && { date: data.date ? new Date(data.date) : null }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.mediaUrls !== undefined && { mediaUrls: data.mediaUrls }),
        ...(data.mood !== undefined && { mood: data.mood }),
        ...(data.locationLat !== undefined && { locationLat: data.locationLat }),
        ...(data.locationLng !== undefined && { locationLng: data.locationLng }),
        ...(data.locationName !== undefined && { locationName: data.locationName }),
        ...(data.locationCity !== undefined && { locationCity: data.locationCity }),
        ...(data.locationCountry !== undefined && { locationCountry: data.locationCountry }),
      },
    });

    res.json({ success: true, data: { entry: updated } });
  } catch (err) {
    next(err);
  }
}

export async function deleteEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const journalId = req.params.id as string;
    const entryId = req.params.entryId as string;
    const userId = req.user!.userId;

    const journal = await prisma.journal.findUnique({ where: { id: journalId } });

    if (!journal || journal.isDeleted || journal.userId !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    const entry = await prisma.journalEntry.findUnique({ where: { id: entryId } });

    if (!entry || entry.isDeleted || entry.journalId !== journalId) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Entry not found' },
      });
      return;
    }

    await prisma.$transaction([
      prisma.journalEntry.update({
        where: { id: entryId },
        data: { isDeleted: true },
      }),
      prisma.journal.update({
        where: { id: journalId },
        data: {
          entryCount: { decrement: journal.entryCount > 0 ? 1 : 0 },
        },
      }),
    ]);

    res.json({ success: true, data: { message: 'Entry deleted' } });
  } catch (err) {
    next(err);
  }
}
