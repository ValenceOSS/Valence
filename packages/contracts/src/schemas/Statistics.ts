import { z } from 'zod';
import { PLAYBACK_MODES } from '@ValenceContracts/functions/describePlaybackMode';
import { ReasonCodeSchema } from './PlaybackPlan';

const STATISTICS_RANGES = ['week', 'month', 'quarter', 'year'] as const;

const StatisticsRangeSchema = z.enum(STATISTICS_RANGES);

const PlaybackModeSchema = z.enum(PLAYBACK_MODES);

const ModeCountsSchema = z.object({
  DirectPlay: z.number().int().nonnegative(),
  Remux: z.number().int().nonnegative(),
  DirectStream: z.number().int().nonnegative(),
  Transcode: z.number().int().nonnegative(),
});

const StatisticsSchema = z.object({
  range: StatisticsRangeSchema,
  from: z.string().datetime(),
  to: z.string().datetime(),
  totals: z.object({
    plays: z.number().int().nonnegative(),
    hours: z.number().nonnegative(),
    viewers: z.number().int().nonnegative(),
    titles: z.number().int().nonnegative(),
  }),
  days: z.array(
    z.object({
      day: z.string(),
      plays: z.number().int().nonnegative(),
      hours: z.number().nonnegative(),
    }),
  ),
  busyHours: z.array(z.array(z.number().int().nonnegative()).length(24)).length(7),
  busyDetail: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        hour: z.number().int().min(0).max(23),
        viewers: z.array(z.string()),
        titles: z.array(z.string()),
      }),
    )
    .default([]),
  topTitles: z.array(
    z.object({
      mediaItemId: z.string(),
      seriesId: z.string().nullable(),
      title: z.string(),
      plays: z.number().int().nonnegative(),
      hours: z.number().nonnegative(),
    }),
  ),
  topViewers: z.array(
    z.object({
      profileId: z.string(),
      name: z.string(),
      plays: z.number().int().nonnegative(),
      hours: z.number().nonnegative(),
    }),
  ),
  modes: ModeCountsSchema,
  reasons: z.array(z.object({ code: ReasonCodeSchema, plays: z.number().int().nonnegative() })),
  clients: z.array(
    z.object({
      client: z.string(),
      modes: ModeCountsSchema,
      plays: z.number().int().nonnegative(),
    }),
  ),
  added: z.array(z.object({ week: z.string(), items: z.number().int().nonnegative() })),
});

type StatisticsRange = z.infer<typeof StatisticsRangeSchema>;
type Statistics = z.infer<typeof StatisticsSchema>;
type ModeCounts = z.infer<typeof ModeCountsSchema>;

export type { ModeCounts, Statistics, StatisticsRange };

export {
  ModeCountsSchema,
  PlaybackModeSchema,
  STATISTICS_RANGES,
  StatisticsRangeSchema,
  StatisticsSchema,
};
