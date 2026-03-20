import { z } from 'zod/v4';

export const updateProfileSchema = z.object({
  displayName: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().optional(),
  homeCity: z.string().max(100).optional(),
  homeCountry: z.string().max(100).optional(),
  homeLat: z.number().min(-90).max(90).optional(),
  homeLng: z.number().min(-180).max(180).optional(),
  isPrivate: z.boolean().optional(),
  showLocation: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
