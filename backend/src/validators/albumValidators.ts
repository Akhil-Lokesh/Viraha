import { z } from 'zod/v4';

export const createAlbumSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  coverImage: z.string().optional(),
  privacy: z.enum(['private', 'followers', 'public']).default('public'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const updateAlbumSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  privacy: z.enum(['private', 'followers', 'public']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const addPostToAlbumSchema = z.object({
  postId: z.string().uuid(),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>;
export type AddPostToAlbumInput = z.infer<typeof addPostToAlbumSchema>;
