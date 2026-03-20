import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v4';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Sentry } from '../lib/sentry';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err.message);

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
