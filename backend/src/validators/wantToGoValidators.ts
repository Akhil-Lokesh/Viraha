import { z } from 'zod/v4';

export const createWantToGoSchema = z.object({
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationName: z.string().max(255).optional(),
  locationCity: z.string().max(100).optional(),
  locationCountry: z.string().max(100).optional(),
  placeId: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export const updateWantToGoSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['dreaming', 'planned', 'visited']).optional(),
});

export type CreateWantToGoInput = z.infer<typeof createWantToGoSchema>;
export type UpdateWantToGoInput = z.infer<typeof updateWantToGoSchema>;
