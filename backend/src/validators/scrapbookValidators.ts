import { z } from 'zod/v4';

export const createScrapbookSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  coverImage: z.string().url().optional(),
});

export const updateScrapbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

function isHttpUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

export const addScrapbookItemSchema = z
  .object({
    itemType: z.enum(['saved_post', 'note', 'link', 'place_pin']),
    referenceId: z.string().uuid().optional(),
    content: z.string().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    // Link items are rendered as anchor hrefs on the client. Restrict them to
    // http(s) URLs so javascript:/data:/other schemes can never persist and
    // execute on click (stored XSS).
    if (value.itemType === 'link') {
      if (!value.content || value.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content'],
          message: 'A link item requires a URL',
        });
        return;
      }
      if (!isHttpUrl(value.content.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['content'],
          message: 'Link content must be a valid http(s) URL',
        });
      }
    }
  });

export type CreateScrapbookInput = z.infer<typeof createScrapbookSchema>;
export type UpdateScrapbookInput = z.infer<typeof updateScrapbookSchema>;
export type AddScrapbookItemInput = z.infer<typeof addScrapbookItemSchema>;
