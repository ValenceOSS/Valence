import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

type ChosenDownloadsBarProps = {
  total: number;
  chosen: readonly QueuedDownload[];
  isBusy: boolean;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
  onClear: () => void;
};

export type { ChosenDownloadsBarProps };
