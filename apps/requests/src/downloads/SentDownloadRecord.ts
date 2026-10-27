import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type SentDownloadRecord = Pick<
  QueuedDownload,
  | 'id'
  | 'clientId'
  | 'protocol'
  | 'libraryKind'
  | 'title'
  | 'indexerName'
  | 'state'
  | 'problem'
  | 'problemCode'
  | 'progress'
  | 'sizeBytes'
  | 'doneBytes'
  | 'sentAt'
  | 'finishedAt'
  | 'filedInto'
  | 'filingProblem'
  | 'filingProblemCode'
> & {
  remoteId: string;
  contentPath: string | null;
  libraryId: string | null;
  libraryPath: string | null;
  filingAttempts: number;
  filesChecked: boolean;
  requestId?: string | null;
  isUnneeded?: boolean;
  removesWhenDone: boolean;
  wasPaused: boolean;
  startedAt: string | null;
  seedSeconds: number | null;
  seedRatio: number | null;
  updatedAt: string;
};

type SentDownloadStore = RecordStore<SentDownloadRecord>;

export type { SentDownloadRecord, SentDownloadStore };
