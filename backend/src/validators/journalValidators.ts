import { z } from 'zod/v4';

export const createJournalSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
  coverImage: z.string().optional(),
  privacy: z.enum(['private', 'followers', 'public']).default('public'),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateJournalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(2000).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  privacy: z.enum(['private', 'followers', 'public']).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const createJournalEntrySchema = z.object({
  date: z.string().optional(),
  title: z.string().max(200).optional(),
  content: z.string().max(50000).optional(),
  mediaUrls: z.array(z.string()).max(10).optional(),
  mood: z.string().max(30).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(255).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountry: z.string().max(100).optional(),
});

export const updateJournalEntrySchema = z.object({
  date: z.string().optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  content: z.string().max(50000).optional().nullable(),
  mediaUrls: z.array(z.string()).max(10).optional(),
  mood: z.string().max(30).optional().nullable(),
  locationLat: z.number().min(-90).max(90).optional().nullable(),
  locationLng: z.number().min(-180).max(180).optional().nullable(),
  locationName: z.string().max(255).optional().nullable(),
  locationCity: z.string().max(100).optional().nullable(),
  locationCountry: z.string().max(100).optional().nullable(),
});

export type CreateJournalInput = z.infer<typeof createJournalSchema>;
export type UpdateJournalInput = z.infer<typeof updateJournalSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
