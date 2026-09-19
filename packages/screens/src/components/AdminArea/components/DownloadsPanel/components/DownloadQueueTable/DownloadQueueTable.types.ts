import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

type DownloadQueueTableProps = {
  downloads: readonly QueuedDownload[];
  busyId: string | null;
  onPause: (download: QueuedDownload) => void;
  onResume: (download: QueuedDownload) => void;
  onRemove: (download: QueuedDownload) => void;
};

export type { DownloadQueueTableProps };
