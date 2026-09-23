import { partsOfDownload } from '@ValenceTv/requests/partsOfDownload';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * How a download is going, on one line, as the web's request pages say it: how far through it is,
 * how much has arrived of how much, how fast it is arriving and how long is left.
 *
 * @param progress - How the download is going.
 * @returns The line, starting with how far through it is.
 */
const describeDownload = (progress: RequestProgress): string => {
  const { percent, arrived, speed, left } = partsOfDownload(progress);

  return [percent, arrived, speed, left === null ? null : `${left} left`]
    .filter((part) => part !== null)
    .join(' · ');
};

export { describeDownload };
