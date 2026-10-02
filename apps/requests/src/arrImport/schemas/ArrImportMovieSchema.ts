import { z } from 'zod';

const ArrImportMovieSchema = z.object({
  id: z.number().int(),
  tmdbId: z.number().int().default(0),
  title: z.string(),
  monitored: z.boolean().default(false),
  hasFile: z.boolean().default(false),
  path: z.string().nullish(),
  rootFolderPath: z.string().nullish(),
  qualityProfileId: z.number().int().nullish(),
});

type ArrImportMovie = z.infer<typeof ArrImportMovieSchema>;

export type { ArrImportMovie };

export { ArrImportMovieSchema };
