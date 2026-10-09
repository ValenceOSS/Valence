import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';
import type { DownloadStopNext } from '@ValenceContracts/schemas/MediaRequest';

type StopDownloadDialogProps = {
  download: RequestDownload | null;
  isStopping: boolean;
  onClose: () => void;
  onStop: (next: DownloadStopNext, isDeletingFiles: boolean) => void;
};

export type { StopDownloadDialogProps };
