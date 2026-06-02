import { z } from 'zod/v4';

export const updateJourneySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

export type UpdateJourneyInput = z.infer<typeof updateJourneySchema>;
