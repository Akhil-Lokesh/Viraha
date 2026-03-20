import { z } from 'zod/v4';

export const updateTravelModeSchema = z.object({
  mode: z.enum(['local', 'traveling']),
  currentLat: z.number().min(-90).max(90).optional(),
  currentLng: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => {
    if (data.mode === 'traveling') {
      return data.currentLat !== undefined && data.currentLng !== undefined;
    }
    return true;
  },
  { message: 'currentLat and currentLng are required when mode is traveling' }
);

export type UpdateTravelModeInput = z.infer<typeof updateTravelModeSchema>;
