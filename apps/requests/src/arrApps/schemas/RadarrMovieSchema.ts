import { z } from 'zod';

const RadarrMovieSchema = z.object({
  id: z.number().int(),
  tmdbId: z.number().int(),
  title: z.string(),
  path: z.string().nullish(),
  monitored: z.boolean(),
  hasFile: z.boolean().default(false),
  movieFile: z.object({ path: z.string().nullish() }).nullish(),
});

type RadarrMovie = z.infer<typeof RadarrMovieSchema>;

export type { RadarrMovie };

export { RadarrMovieSchema };
