import { Request, Response, NextFunction } from 'express';
import { processAndUploadImage, processAndUploadAvatar } from '../lib/image';
import { prisma } from '../lib/prisma';

export async function uploadPhotos(req: Request, res: Response, next: NextFunction) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No files uploaded' },
      });
      return;
    }

    const results = await Promise.all(
      files.map((file) => processAndUploadImage(file.buffer, file.mimetype))
    );

    const urls = results.map((r) => r.url);
    const thumbnails = results.map((r) => r.thumbnailUrl);

    res.status(201).json({
      success: true,
      data: { urls, thumbnails },
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
      });
      return;
    }

    const avatarUrl = await processAndUploadAvatar(file.buffer);

    // Update user avatar in database
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { avatar: avatarUrl },
    });

    const { passwordHash, ...sanitized } = user;

    res.json({
      success: true,
      data: { user: sanitized },
    });
  } catch (err) {
    next(err);
  }
}
