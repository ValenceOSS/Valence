import { z } from 'zod';

const ArrQueueRecordSchema = z.object({
  id: z.number().int(),
  title: z.string().default(''),
  status: z.string().default('unknown'),
  size: z.number().nonnegative().nullish(),
  sizeleft: z.number().nonnegative().nullish(),
  timeleft: z.string().nullish(),
  trackedDownloadStatus: z.string().nullish(),
  trackedDownloadState: z.string().nullish(),
  statusMessages: z
    .array(z.object({ title: z.string().nullish(), messages: z.array(z.string()).default([]) }))
    .default([]),
  errorMessage: z.string().nullish(),
  downloadClient: z.string().nullish(),
  movieId: z.number().int().nullish(),
  seriesId: z.number().int().nullish(),
  episodeId: z.number().int().nullish(),
  artistId: z.number().int().nullish(),
  albumId: z.number().int().nullish(),
});

const ArrQueuePageSchema = z.object({
  page: z.number().int().default(1),
  totalRecords: z.number().int().nonnegative().default(0),
  records: z.array(ArrQueueRecordSchema).default([]),
});

type ArrQueueRecord = z.infer<typeof ArrQueueRecordSchema>;

export type { ArrQueueRecord };

export { ArrQueuePageSchema };
