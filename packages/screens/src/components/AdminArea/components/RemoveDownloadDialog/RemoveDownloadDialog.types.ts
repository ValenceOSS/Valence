import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

type RemoveDownloadDialogProps = {
  downloads: readonly QueuedDownload[];
  keepsFinishedFiles?: boolean;
  onClose: () => void;
  onConfirm: (deleteData: boolean) => void;
};

export type { RemoveDownloadDialogProps };
