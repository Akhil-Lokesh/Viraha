import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v4';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Sentry } from '../lib/sentry';
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

  // Report unexpected errors to Sentry
  Sentry.captureException(err);

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' },
  });
}
