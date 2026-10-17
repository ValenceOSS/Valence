import type { QueuedDownload, QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';

type DownloadStateChoiceProps = {
  downloads: readonly QueuedDownload[];
  value: QueuedDownloadState | null;
  onChange: (state: QueuedDownloadState | null) => void;
};

export type { DownloadStateChoiceProps };
