import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v4';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import multer from 'multer';
import { captureException } from '../lib/sentry';
import { logger } from '../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, url: req.originalUrl, method: req.method, userId: (req as any).user?.userId }, 'Request error');

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token expired' },
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
    return;
  }

  // Known Prisma client errors — map to clean 4xx instead of a 500.
  // P2023 = malformed input (e.g. a non-UUID id in the path) -> treat as not found.
  // P2025 = record required but not found. P2002 = unique constraint violation.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2023' || err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: 'Resource already exists' },
      });
      return;
    }
  }

  // Multer upload errors (file count / size / unexpected field). Without this
  // branch they fall through to a generic 500 + spurious Sentry report instead
  // of a clear 4xx telling the client what to fix.
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'One or more files exceed the maximum allowed size',
        },
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Too many files uploaded (maximum is 10)',
        },
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'File upload failed' },
    });
    return;
  }

  // http-errors-style client errors (e.g. csrf-csrf throws a ForbiddenError with
  // statusCode 403 / code EBADCSRFTOKEN). Honor their status instead of masking
  // every one as a 500 — the client relies on 401/403 to drive token refresh/retry.
  const httpStatus =
    (err as { statusCode?: number }).statusCode ?? (err as { status?: number }).status;
  if (typeof httpStatus === 'number' && httpStatus >= 400 && httpStatus < 500) {
    const codeByStatus: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      413: 'PAYLOAD_TOO_LARGE',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      429: 'TOO_MANY_REQUESTS',
    };
    const isCsrf = (err as { code?: string }).code === 'EBADCSRFTOKEN';
    res.status(httpStatus).json({
      success: false,
      error: {
        code: codeByStatus[httpStatus] ?? 'BAD_REQUEST',
        message: isCsrf ? 'Invalid or missing CSRF token' : 'Request could not be processed',
      },
    });
    return;
  }

  // Report unexpected errors to Sentry
  captureException(err);

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
}
