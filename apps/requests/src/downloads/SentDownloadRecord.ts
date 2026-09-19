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
  | 'progress'
  | 'sizeBytes'
  | 'doneBytes'
  | 'sentAt'
  | 'finishedAt'
> & {
  remoteId: string;
  updatedAt: string;
};

type SentDownloadStore = RecordStore<SentDownloadRecord>;

export type { SentDownloadRecord, SentDownloadStore };
