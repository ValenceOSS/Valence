import { z } from 'zod';

const StreamTitleSchema = z.object({
  kind: z.literal('film'),
  catalogueId: z.string().min(1).max(200),
  tmdbId: z.string().max(40).nullable(),
  imdbId: z.string().max(40).nullable(),
  title: z.string().min(1).max(500),
  year: z.number().int().nullable(),
});

type StreamTitle = z.infer<typeof StreamTitleSchema>;

export type { StreamTitle };

export { StreamTitleSchema };
