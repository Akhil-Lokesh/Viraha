import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function handleGetScrapbooks(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const scrapbooks = await prisma.scrapbook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { orderBy: { sortOrder: 'asc' }, take: 4 },
        _count: { select: { items: true } },
      },
    });
    res.json({ success: true, data: scrapbooks });
  } catch (err) {
    next(err);
  }
}

export async function handleGetScrapbook(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const scrapbook = await prisma.scrapbook.findFirst({
      where: { id, userId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!scrapbook) {
      res.status(404).json({ success: false, error: 'Scrapbook not found' });
      return;
    }

    res.json({ success: true, data: scrapbook });
  } catch (err) {
    next(err);
  }
}

export async function handleCreateScrapbook(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { title, description, coverImage } = req.body;

    const scrapbook = await prisma.scrapbook.create({
      data: { userId, title, description, coverImage },
    });

    res.status(201).json({ success: true, data: scrapbook });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateScrapbook(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;
    const { title, description, coverImage } = req.body;

    const existing = await prisma.scrapbook.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Scrapbook not found' });
      return;
    }

    const updated = await prisma.scrapbook.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function handleDeleteScrapbook(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.scrapbook.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Scrapbook not found' });
      return;
    }

    await prisma.scrapbook.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function handleAddScrapbookItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const scrapbookId = req.params.id as string;
    const { itemType, referenceId, content } = req.body;

    const scrapbook = await prisma.scrapbook.findFirst({ where: { id: scrapbookId, userId } });
    if (!scrapbook) {
      res.status(404).json({ success: false, error: 'Scrapbook not found' });
      return;
    }

    const maxOrder = await prisma.scrapbookItem.aggregate({
      where: { scrapbookId },
      _max: { sortOrder: true },
    });

    const item = await prisma.scrapbookItem.create({
      data: {
        scrapbookId,
        itemType,
        referenceId,
        content,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function handleRemoveScrapbookItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const itemId = req.params.itemId as string;

    const item = await prisma.scrapbookItem.findUnique({
      where: { id: itemId },
      include: { scrapbook: true },
    });

    if (!item || item.scrapbook.userId !== userId) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    await prisma.scrapbookItem.delete({ where: { id: itemId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
