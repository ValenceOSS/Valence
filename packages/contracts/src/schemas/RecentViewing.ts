import { z } from 'zod';

const RecentViewingSchema = z.object({
  id: z.string(),
  mediaItemId: z.string(),
  title: z.string().nullable(),
  seriesTitle: z.string().nullable(),
  profileId: z.string(),
  profileName: z.string().nullable(),
  accountId: z.string().nullable(),
  deviceLabel: z.string().nullable(),
  startedAt: z.string(),
  lastWatchedAt: z.string(),
  secondsWatched: z.number(),
  isFinished: z.boolean(),
});

const RecentViewingListSchema = z.object({ viewings: z.array(RecentViewingSchema) });

type RecentViewing = z.infer<typeof RecentViewingSchema>;

export type { RecentViewing };

export { RecentViewingListSchema, RecentViewingSchema };
