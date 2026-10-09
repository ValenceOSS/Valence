import { z } from 'zod';

const SonarrSeriesSchema = z.object({
  id: z.number().int().default(0),
  tvdbId: z.number().int(),
  title: z.string(),
  titleSlug: z.string().nullish(),
  path: z.string().nullish(),
  monitored: z.boolean().default(false),
  seasons: z
    .array(z.object({ seasonNumber: z.number().int(), monitored: z.boolean().default(false) }))
    .default([]),
});

type SonarrSeries = z.infer<typeof SonarrSeriesSchema>;

export type { SonarrSeries };

export { SonarrSeriesSchema };
