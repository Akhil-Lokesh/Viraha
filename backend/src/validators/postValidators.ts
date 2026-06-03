import { z } from 'zod/v4';

// Media URLs are either absolute https URLs (R2-backed deploys) or relative
// `/uploads/` paths (local-disk fallback when R2 env vars are unset, the
// default per .env.example). Reject anything else — notably javascript:/data:
// — to prevent stored-XSS via media fields.
const mediaUrl = z
  .string()
  .max(2048, { message: 'Please provide a valid media URL' })
  .refine((u) => u.startsWith('https://') || u.startsWith('/uploads/'), {
    message: 'Media URLs must use https or be an /uploads/ path',
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
