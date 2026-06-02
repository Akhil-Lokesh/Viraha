import { z } from 'zod/v4';

export const createScrapbookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional(),
});

export const updateScrapbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

export const addScrapbookItemSchema = z.object({
  itemType: z.enum(['saved_post', 'note', 'link', 'place_pin']),
  referenceId: z.string().uuid().optional(),
  content: z.string().max(2000).optional(),
});

export type CreateScrapbookInput = z.infer<typeof createScrapbookSchema>;
export type UpdateScrapbookInput = z.infer<typeof updateScrapbookSchema>;
export type AddScrapbookItemInput = z.infer<typeof addScrapbookItemSchema>;
