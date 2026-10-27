import { z } from 'zod';
import { RemoteRefusalSchema } from '@ValenceSDK/remoteFiles/RemoteRefusalSchema';
import { DownloadIdSchema } from './DownloadIdSchema';

const CountSchema = z.number().int().nonnegative().nullable().default(null);

const DownloadStatusSchema = z.object({
  id: DownloadIdSchema,
  state: z.enum(['queued', 'downloading', 'stalled', 'done', 'failed']),
  progress: z.number().min(0).max(1),
  sizeBytes: CountSchema,
  doneBytes: CountSchema,
  bytesPerSecond: CountSchema,
  secondsLeft: CountSchema,
  seeds: CountSchema,
  peers: CountSchema,
  failure: RemoteRefusalSchema.nullable().default(null),
});

type DownloadStatus = z.infer<typeof DownloadStatusSchema>;

export type { DownloadStatus };

export { DownloadStatusSchema };
