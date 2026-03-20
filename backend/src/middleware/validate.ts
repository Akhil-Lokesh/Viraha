import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod/v4';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Validation failed',
          details: result.error.issues,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
