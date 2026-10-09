import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';

type DownloadRowProps = {
  download: RequestDownload;
  onStop: (download: RequestDownload) => void;
};

export type { DownloadRowProps };
