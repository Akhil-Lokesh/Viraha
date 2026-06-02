import { z } from 'zod/v4';

// Media URLs must be absolute https URLs (uploaded assets). Reject anything
// non-http(s) such as javascript:/data: to prevent stored-XSS via media fields.
const mediaUrl = z
  .string()
  .url({ message: 'Please provide a valid media URL' })
  .refine((u) => u.startsWith('https://'), {
    message: 'Media URLs must use https',
  });

export const createPostSchema = z.object({
  caption: z.string().max(2000).optional(),
  mediaUrls: z.array(mediaUrl).min(1).max(10),
  mediaThumbnails: z.array(mediaUrl).optional(),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationName: z.string().max(255).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountry: z.string().max(100).optional(),
  placeId: z.string().max(255).optional(),
  takenAt: z.string().datetime().optional(),
  privacy: z.enum(['private', 'followers', 'public']).default('public'),
  tags: z.array(z.string().max(50)).max(20).optional(),
  travelMode: z.enum(['local', 'traveling']).optional(),
  allowComments: z.boolean().optional(),
});

export const updatePostSchema = z.object({
  caption: z.string().max(2000).optional(),
  privacy: z.enum(['private', 'followers', 'public']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  allowComments: z.boolean().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
