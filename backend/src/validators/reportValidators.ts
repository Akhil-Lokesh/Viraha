import { z } from 'zod/v4';

export const createReportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user', 'journal']),
  targetId: z.uuid(),
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'other']),
  details: z.string().max(2000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
