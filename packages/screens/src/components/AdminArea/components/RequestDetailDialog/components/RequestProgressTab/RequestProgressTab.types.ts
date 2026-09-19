import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestProgressTabProps = {
  request: MediaRequest;
  busyId: string | null;
  onPause: (download: QueuedDownload) => void;
  onResume: (download: QueuedDownload) => void;
  onRemove: (download: QueuedDownload) => void;
  onFile: (download: QueuedDownload, libraryId: string) => void;
};

export type { RequestProgressTabProps };
