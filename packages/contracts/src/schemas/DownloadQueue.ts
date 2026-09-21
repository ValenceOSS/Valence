import { z } from 'zod';
import { DownloadClientKindSchema } from './DownloadClient';
import { ReleaseProtocolSchema } from './Indexer';
import { LibraryKindSchema } from './Library';
import { MediaRequestKindSchema } from './MediaRequest';

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
  libraryKind: LibraryKindSchema,
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
  filedInto: z.string().nullable().default(null),
  filingProblem: z.string().nullable().default(null),
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

const FilingLibrarySchema = z.object({ id: z.string().min(1), path: z.string().min(1) });

const ReleaseSendSchema = z.object({
  indexerId: z.string().uuid(),
  url: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  protocol: ReleaseProtocolSchema,
  libraryKind: LibraryKindSchema,
  sizeBytes: z.number().nonnegative().nullable().default(null),
  indexerName: z.string().max(200).nullable().default(null),
  clientId: z.string().uuid().optional(),
  libraryId: z.string().min(1).optional(),
  library: FilingLibrarySchema.nullable().default(null),
  minimumSeedSeconds: z.number().int().nonnegative().nullable().default(null),
  minimumRatio: z.number().nonnegative().nullable().default(null),
});

const DownloadFilingSchema = z.object({ libraryId: z.string().min(1) });

const DownloadFilingOrderSchema = z.object({ library: FilingLibrarySchema });

const DownloadRemovalSchema = z.object({ deleteData: z.boolean().default(false) });

const EventBaseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  at: z.string().datetime(),
});

const RequestEventBaseSchema = EventBaseSchema.extend({
  requestId: z.string().uuid(),
  requestedById: z.string(),
});

const ServiceEventSchema = z.discriminatedUnion('kind', [
  EventBaseSchema.extend({ kind: z.literal('started'), clientName: z.string() }),
  EventBaseSchema.extend({
    kind: z.literal('failed'),
    clientName: z.string(),
    problem: z.string(),
  }),
  RequestEventBaseSchema.extend({ kind: z.literal('chosen'), releaseTitle: z.string() }),
  RequestEventBaseSchema.extend({
    kind: z.literal('filed'),
    requestKind: MediaRequestKindSchema,
    tmdbId: z.number().int().positive().nullable(),
    musicBrainzId: z.string().uuid().nullable().default(null),
    libraryId: z.string(),
    folder: z.string(),
  }),
  RequestEventBaseSchema.extend({ kind: z.literal('stuck'), problem: z.string() }),
  EventBaseSchema.extend({ kind: z.literal('sweptUp'), clientName: z.string() }),
  EventBaseSchema.extend({
    kind: z.literal('imported'),
    libraryId: z.string(),
    folder: z.string(),
  }),
]);

const DownloadStreamFrameSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('queue'), queue: DownloadQueueSchema }),
  z.object({ kind: z.literal('events'), events: z.array(ServiceEventSchema) }),
]);

const DownloadWatchSchema = z.object({ isWatching: z.boolean() });

const ServiceEventAckSchema = z.object({ ids: z.array(z.number().int().positive()).max(500) });

type QueuedDownloadState = z.infer<typeof QueuedDownloadStateSchema>;
type QueuedDownload = z.infer<typeof QueuedDownloadSchema>;
type DownloadClientState = z.infer<typeof DownloadClientStateSchema>;
type DownloadQueue = z.infer<typeof DownloadQueueSchema>;
type ReleaseSend = z.input<typeof ReleaseSendSchema>;
type ServiceEvent = z.infer<typeof ServiceEventSchema>;
type DownloadStreamFrame = z.infer<typeof DownloadStreamFrameSchema>;

export type {
  DownloadClientState,
  DownloadQueue,
  DownloadStreamFrame,
  QueuedDownload,
  QueuedDownloadState,
  ReleaseSend,
  ServiceEvent,
};

export {
  QUEUED_DOWNLOAD_STATES,
  DownloadClientStateSchema,
  DownloadQueueSchema,
  DownloadFilingOrderSchema,
  DownloadFilingSchema,
  DownloadRemovalSchema,
  DownloadStreamFrameSchema,
  DownloadWatchSchema,
  QueuedDownloadSchema,
  QueuedDownloadStateSchema,
  ReleaseSendSchema,
  ServiceEventAckSchema,
  ServiceEventSchema,
};
