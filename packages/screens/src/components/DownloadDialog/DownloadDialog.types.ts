import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type DownloadSeries = {
  id: string;
  title: string;
  episodes: number;
  mediaIds?: readonly string[];
};

type DownloadDialogProps = {
  media: MediaSummary | null;
  series?: DownloadSeries | null;
  onClose: () => void;
};

export type { DownloadDialogProps, DownloadSeries };
