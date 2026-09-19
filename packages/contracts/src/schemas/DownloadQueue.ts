import { z } from 'zod';
import { DownloadClientKindSchema } from './DownloadClient';
import { ReleaseProtocolSchema } from './Indexer';

const QUEUED_DOWNLOAD_STATES = [
  'queued',
  'downloading',
  'stalled',
  'paused',
  'processing',
  'done',
  'failed',
] as const;

const QueuedDownloadStateSchema = z.enum(QUEUED_DOWNLOAD_STATES);

const QueuedDownloadSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  clientName: z.string(),
  protocol: ReleaseProtocolSchema,
  title: z.string(),
  indexerName: z.string().nullable(),
  state: QueuedDownloadStateSchema,
  problem: z.string().nullable(),
  progress: z.number().min(0).max(1),
  sizeBytes: z.number().nonnegative().nullable(),
  doneBytes: z.number().nonnegative().nullable(),
  downloadBytesPerSecond: z.number().nonnegative().nullable(),
  uploadBytesPerSecond: z.number().nonnegative().nullable(),
  secondsLeft: z.number().int().nonnegative().nullable(),
  seeds: z.number().int().nonnegative().nullable(),
  peers: z.number().int().nonnegative().nullable(),
  sentAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
});

const DownloadClientStateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  kind: DownloadClientKindSchema,
  isEnabled: z.boolean(),
  isReachable: z.boolean(),
  problem: z.string().nullable(),
  downloadBytesPerSecond: z.number().nonnegative().nullable(),
  uploadBytesPerSecond: z.number().nonnegative().nullable(),
  checkedAt: z.string().datetime().nullable(),
});

const DownloadQueueSchema = z.object({
  clients: z.array(DownloadClientStateSchema),
  downloads: z.array(QueuedDownloadSchema),
  checkedAt: z.string().datetime().nullable(),
});

const ReleaseSendSchema = z.object({
  indexerId: z.string().uuid(),
  url: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  protocol: ReleaseProtocolSchema,
  sizeBytes: z.number().nonnegative().nullable().default(null),
  indexerName: z.string().max(200).nullable().default(null),
  clientId: z.string().uuid().optional(),
});

const DownloadRemovalSchema = z.object({ deleteData: z.boolean().default(false) });

const DownloadEventSchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(['started', 'failed']),
  title: z.string(),
  clientName: z.string(),
  problem: z.string().nullable(),
  at: z.string().datetime(),
});

const DownloadStreamFrameSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('queue'), queue: DownloadQueueSchema }),
  z.object({ kind: z.literal('events'), events: z.array(DownloadEventSchema) }),
]);

const DownloadWatchSchema = z.object({ isWatching: z.boolean() });

const DownloadEventAckSchema = z.object({ ids: z.array(z.number().int().positive()).max(500) });

type QueuedDownloadState = z.infer<typeof QueuedDownloadStateSchema>;
type QueuedDownload = z.infer<typeof QueuedDownloadSchema>;
type DownloadClientState = z.infer<typeof DownloadClientStateSchema>;
type DownloadQueue = z.infer<typeof DownloadQueueSchema>;
type ReleaseSend = z.input<typeof ReleaseSendSchema>;
type DownloadRemoval = z.input<typeof DownloadRemovalSchema>;
type DownloadEvent = z.infer<typeof DownloadEventSchema>;
type DownloadStreamFrame = z.infer<typeof DownloadStreamFrameSchema>;

export type {
  DownloadClientState,
  DownloadEvent,
  DownloadQueue,
  DownloadRemoval,
  DownloadStreamFrame,
  QueuedDownload,
  QueuedDownloadState,
  ReleaseSend,
};

export {
  QUEUED_DOWNLOAD_STATES,
  DownloadClientStateSchema,
  DownloadEventAckSchema,
  DownloadEventSchema,
  DownloadQueueSchema,
  DownloadRemovalSchema,
  DownloadStreamFrameSchema,
  DownloadWatchSchema,
  QueuedDownloadSchema,
  QueuedDownloadStateSchema,
  ReleaseSendSchema,
};
