import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

type RemoveDownloadDialogProps = {
  download: QueuedDownload | null;
  keepsFinishedFiles?: boolean;
  onClose: () => void;
  onConfirm: (deleteData: boolean) => void;
};

export type { RemoveDownloadDialogProps };
