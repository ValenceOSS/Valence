import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type TitleProgressProps = {
  request: MediaRequest;
  downloads: readonly RequestDownload[];
  onStop: (download: RequestDownload) => void;
};

export type { TitleProgressProps };
