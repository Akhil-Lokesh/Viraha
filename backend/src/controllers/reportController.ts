import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { CreateReportInput } from '../validators/reportValidators';

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { targetType, targetId, reason, details } = req.body as CreateReportInput;

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
    next(err);
  }
}
