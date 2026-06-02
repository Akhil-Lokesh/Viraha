import { z } from 'zod/v4';

export const createTimeCapsuleSchema = z.object({
  content: z.string().min(1).max(10000),
  locationName: z.string().max(255).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  type: z.enum(['departure', 'letter_to_self']).optional(),
  openAt: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: 'openAt must be a future date',
    }),
});

export type CreateTimeCapsuleInput = z.infer<typeof createTimeCapsuleSchema>;
