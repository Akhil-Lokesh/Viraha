import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getHiddenUserIds, isBlockedBetween } from '../lib/blocks';
import { CreateJournalInput, UpdateJournalInput, CreateJournalEntryInput, UpdateJournalEntryInput } from '../validators/journalValidators';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

// Max entries embedded in a journal-detail response. When the journal has more
// non-deleted entries than this, the response sets entriesHasMore so the client
// knows to paginate the rest via getEntries rather than silently dropping them.
const ENTRIES_PAGE_SIZE = 50;

function countWords(content: string | null | undefined): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

// Build a Prisma update op that applies a running delta to the journal's cached
// wordCount, flooring the result at 0 so a stale count can never go negative.
// Returned (not awaited) so the caller can compose it into the same transaction
// as the entry mutation that produced the delta, keeping the count atomic.
function wordCountUpdateOp(
  journalId: string,
  currentWordCount: number,
  delta: number,
): Prisma.PrismaPromise<Prisma.BatchPayload> | null {
  if (delta === 0) return null;
  const next = Math.max(0, currentWordCount + delta);
  return prisma.journal.updateMany({
    where: { id: journalId },
    data: { wordCount: next },
  });
}

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

    const where: Prisma.JournalWhereInput = { isDeleted: false };

    if (req.user) {
      const follows = await prisma.follow.findMany({
        where: { followerId: req.user.userId, status: 'accepted' },
        select: { followingId: true },
      });
      const followedIds = follows.map((f) => f.followingId);

      where.OR = [
        { privacy: 'public', status: 'published' },
        { privacy: 'followers', status: 'published', userId: { in: followedIds } },
        { userId: req.user.userId },
      ];

      const hiddenIds = await getHiddenUserIds(req.user.userId);
      if (hiddenIds.length > 0) {
        where.userId = { notIn: hiddenIds };
      }
    } else {
      where.privacy = 'public';
      where.status = 'published';
    }

    if (userId) {
      // Specific-user filter wins, but still respect block visibility
      if (req.user && req.user.userId !== userId) {
        const blocked = await isBlockedBetween(req.user.userId, userId);
        if (blocked) {
          res.json({ success: true, data: { items: [], nextCursor: null } });
          return;
        }
      }
      where.userId = userId;
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
          take: ENTRIES_PAGE_SIZE,
        },
        _count: { select: { entries: { where: { isDeleted: false } } } },
      },
    });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.userId !== req.user?.userId) {
      if (journal.status === 'draft') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Journal not found' },
        });
        return;
      }
      if (journal.privacy === 'private') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Journal not found' },
        });
        return;
      }
      if (journal.privacy === 'followers' && req.user) {
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: journal.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Journal not found' },
          });
          return;
        }
      } else if (journal.privacy === 'followers') {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Journal not found' },
        });
        return;
      }
    }

    const entriesHasMore = journal._count.entries > ENTRIES_PAGE_SIZE;
    res.json({ success: true, data: { journal, entriesHasMore } });
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
          take: ENTRIES_PAGE_SIZE,
        },
        _count: { select: { entries: { where: { isDeleted: false } } } },
      },
    });

    if (!journal || journal.isDeleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Journal not found' },
      });
      return;
    }

    if (journal.userId !== req.user?.userId) {
      if (journal.status === 'draft') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
        return;
      }
      if (journal.privacy === 'private') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
        return;
      }
      if (journal.privacy === 'followers') {
        if (!req.user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
          return;
        }
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: journal.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
          return;
        }
      }
    }

    const entriesHasMore = journal._count.entries > ENTRIES_PAGE_SIZE;
    res.json({ success: true, data: { journal, entriesHasMore } });
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

export async function publishJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const userId = req.user!.userId;

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: { _count: { select: { entries: { where: { isDeleted: false } } } } },
    });

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
        error: { code: 'FORBIDDEN', message: 'You can only publish your own journals' },
      });
      return;
    }

    if (journal.status === 'published') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Journal is already published' },
      });
      return;
    }

    if (journal._count.entries === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Journal must have at least one entry to publish' },
      });
      return;
    }

    const updated = await prisma.journal.update({
      where: { id },
      data: { status: 'published', publishedAt: new Date() },
      include: { user: { select: userSelect } },
    });

    res.json({ success: true, data: { journal: updated } });
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

    // Running-delta word count: only count the new entry, never re-scan all.
    const addedWords = countWords(data.content);
    const updateData: Prisma.JournalUpdateInput = {
      entryCount: { increment: 1 },
      wordCount: { increment: addedWords },
    };
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

    if (journal.userId !== req.user?.userId) {
      if (journal.privacy === 'private') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
        return;
      }
      if (journal.privacy === 'followers') {
        if (!req.user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
          return;
        }
        const follow = await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: req.user.userId, followingId: journal.userId } },
        });
        if (!follow || follow.status !== 'accepted') {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Journal not found' } });
          return;
        }
      }
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

    // Running-delta word count: only the changed entry's old vs new content
    // affects the cached total. Skip the journal write entirely when content
    // is untouched or the word count is unchanged.
    const wordDelta =
      data.content !== undefined ? countWords(data.content) - countWords(entry.content) : 0;
    const wordCountOp = wordCountUpdateOp(journalId, journal.wordCount, wordDelta);

    const updateEntryOp = prisma.journalEntry.update({
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

    const updated = wordCountOp
      ? (await prisma.$transaction([updateEntryOp, wordCountOp]))[0]
      : await updateEntryOp;

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

    // Running-delta word count: subtract only the deleted entry's words,
    // flooring the resulting total at 0 (never re-scan all entries).
    const removedWords = countWords(entry.content);
    const nextWordCount = Math.max(0, journal.wordCount - removedWords);

    await prisma.$transaction([
      prisma.journalEntry.update({
        where: { id: entryId },
        data: { isDeleted: true },
      }),
      prisma.journal.update({
        where: { id: journalId },
        data: {
          entryCount: { decrement: journal.entryCount > 0 ? 1 : 0 },
          wordCount: nextWordCount,
        },
      }),
    ]);

    res.json({ success: true, data: { message: 'Entry deleted' } });
  } catch (err) {
    next(err);
  }
}
