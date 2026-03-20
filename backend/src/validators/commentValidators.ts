import { z } from 'zod/v4';

export const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export const updateCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
