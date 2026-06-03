import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import type { CreateReportInput } from '../validators/reportValidators';

/**
 * Confirm the reported entity actually exists (and is not soft-deleted /
 * deactivated) before accepting a report. Prevents reports against
 * nonexistent or mismatched targets. Returns true when the target is valid.
 */
async function targetExists(
  targetType: CreateReportInput['targetType'],
  targetId: string
): Promise<boolean> {
  switch (targetType) {
    case 'post': {
      const post = await prisma.post.findUnique({
        where: { id: targetId },
        select: { isDeleted: true },
      });
      return Boolean(post) && !post!.isDeleted;
    }
    case 'comment': {
      const comment = await prisma.comment.findUnique({
        where: { id: targetId },
        select: { isDeleted: true },
      });
      return Boolean(comment) && !comment!.isDeleted;
    }
    case 'journal': {
      const journal = await prisma.journal.findUnique({
        where: { id: targetId },
        select: { isDeleted: true },
      });
      return Boolean(journal) && !journal!.isDeleted;
    }
    case 'user': {
      const user = await prisma.user.findUnique({
        where: { id: targetId },
        select: { isActive: true },
      });
      return Boolean(user) && user!.isActive;
    }
    default:
      return false;
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { targetType, targetId, reason, details } = req.body as CreateReportInput;

    // Validate the target exists before recording a report against it.
    if (!(await targetExists(targetType, targetId))) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'The reported content does not exist' },
      });
      return;
    }

    // Suppress duplicate reports from the same reporter for the same target.
    // The DB-level @@unique([reporterId, targetType, targetId]) is the source of
    // truth; this pre-check returns a friendly 409 in the common case while the
    // P2002 catch below closes the concurrent-request race.
    const existing = await prisma.report.findFirst({
      where: { reporterId: userId, targetType, targetId },
    });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'You have already reported this content' },
      });
      return;
    }

    try {
      const report = await prisma.report.create({
        data: {
          reporterId: userId,
          targetType,
          targetId,
          reason,
          details: details || null,
        },
      });

      res.status(201).json({ success: true, data: { report } });
    } catch (err) {
      // Concurrent duplicate report won the unique-constraint race (P2002).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'You have already reported this content' },
        });
        return;
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
