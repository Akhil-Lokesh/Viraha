import { z } from 'zod/v4';

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
