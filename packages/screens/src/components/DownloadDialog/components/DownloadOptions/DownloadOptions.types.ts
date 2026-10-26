import type { DownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import type { DownloadQuality } from '@ValenceContracts/schemas/Download';

type DownloadOptionsProps = {
  options: DownloadOffer['options'];
  chosen: DownloadQuality | null;
  onChoose: (quality: DownloadQuality) => void;
  isOfASeries: boolean;
  freeBytes: number | null;
};

export type { DownloadOptionsProps };
