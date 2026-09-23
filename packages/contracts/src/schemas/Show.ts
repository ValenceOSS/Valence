import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const ShowSummarySchema = z.object({
  id: z.string().min(1),
  libraryId: z.string().uuid(),
  title: z.string().min(1),
  seasonCount: z.number().int().nonnegative(),
  episodeCount: z.number().int().nonnegative(),
  latestAddedAt: z.string(),
  coverMediaId: z.string().uuid(),
  seriesId: z.string().uuid().nullable().default(null),
  year: z.number().int().nullish(),
  rating: z.number().nullish(),
  genres: z.array(z.string()).nullish(),
});

const ShowSeasonSchema = z.object({
  seasonNumber: z.number().int().nullable(),
  episodes: z.array(MediaSummarySchema),
});

const CatalogueEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: z.string(),
  stillUrl: z.string().nullish(),
  overview: z.string().nullish(),
  airDate: z.string().nullish(),
});

const NextEpisodeSchema = z.object({
  seasonNumber: z.number().int().nonnegative(),
  episodeNumber: z.number().int().positive(),
  title: z.string(),
  airDate: z.string(),
});

const SeasonShapeSchema = z.object({
  seasonNumber: z.number().int().nonnegative(),
  episodeCount: z.number().int().nonnegative(),
  episodes: z.array(CatalogueEpisodeSchema).default([]),
});

const ShowDetailSchema = ShowSummarySchema.extend({
  seasons: z.array(ShowSeasonSchema),
  shape: z.array(SeasonShapeSchema).nullish(),
  extras: z.array(MediaSummarySchema).optional(),
  trailerKey: z.string().nullish(),
  status: z.string().nullish(),
  overview: z.string().nullish(),
  nextEpisode: NextEpisodeSchema.nullish(),
});

const ShowListSchema = z.object({ shows: z.array(ShowSummarySchema) });

const ComingUpSchema = z.object({
  shows: z.array(z.object({ show: ShowSummarySchema, episode: NextEpisodeSchema })),
});

type ShowSummary = z.infer<typeof ShowSummarySchema>;
type ShowDetail = z.infer<typeof ShowDetailSchema>;

type ComingUp = z.infer<typeof ComingUpSchema>;

export type { ComingUp, ShowDetail, ShowSummary };

export {
  ComingUpSchema,
  ShowSummarySchema,
  ShowSeasonSchema,
  SeasonShapeSchema,
  ShowDetailSchema,
  ShowListSchema,
};
