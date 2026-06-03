import { z } from 'zod/v4';

export const upsertPlaceNoteSchema = z.object({
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  locationName: z.string().max(255).optional().nullable(),
  locationCity: z.string().max(100).optional().nullable(),
  locationCountry: z.string().max(100).optional().nullable(),
  placeId: z.string().max(255).optional().nullable(),
  note: z.string().max(2000),
});

export type UpsertPlaceNoteInput = z.infer<typeof upsertPlaceNoteSchema>;
