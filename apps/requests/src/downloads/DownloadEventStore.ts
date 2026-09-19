import type { DownloadEvent } from '@ValenceContracts/schemas/DownloadQueue';

type DownloadEventStore = {
  add: (event: Omit<DownloadEvent, 'id' | 'at'>) => Promise<DownloadEvent>;
  pending: () => Promise<DownloadEvent[]>;
  acknowledge: (ids: readonly number[]) => Promise<void>;
};

export type { DownloadEventStore };
