import { z } from 'zod';

const ArrImportSeriesSchema = z.object({
  id: z.number().int(),
  tvdbId: z.number().int().default(0),
  tmdbId: z.number().int().default(0),
  title: z.string(),
  monitored: z.boolean().default(false),
  path: z.string().nullish(),
  rootFolderPath: z.string().nullish(),
  qualityProfileId: z.number().int().nullish(),
  seasons: z
    .array(
      z.object({
        seasonNumber: z.number().int(),
        monitored: z.boolean().default(false),
        statistics: z
          .object({
            episodeFileCount: z.number().int().default(0),
            episodeCount: z.number().int().default(0),
          })
          .nullish(),
      }),
    )
    .default([]),
});

type ArrImportSeries = z.infer<typeof ArrImportSeriesSchema>;

export type { ArrImportSeries };

export { ArrImportSeriesSchema };
