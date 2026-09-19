import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeTimeLeft } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/describeTimeLeft';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';

/**
 * Says how a download is coming along, for whoever is waiting on it: how much has arrived, how
 * fast, and how long is left.
 *
 * @param progress - How the download is going.
 * @returns Such as `2.0 GB of 4.0 GB · 3.0 MB/s · 12 min left`.
 */
const describeDownloadProgress = (progress: RequestProgress): string =>
  [
    progress.sizeBytes === null
      ? null
      : progress.doneBytes === null
        ? formatBytes(progress.sizeBytes)
        : `${formatBytes(progress.doneBytes)} of ${formatBytes(progress.sizeBytes)}`,
    progress.downloadBytesPerSecond === null || progress.downloadBytesPerSecond === 0
      ? null
      : `${formatBytes(progress.downloadBytesPerSecond)}/s`,
    progress.secondsLeft === null ? null : `${describeTimeLeft(progress.secondsLeft)} left`,
  ]
    .filter((part) => part !== null)
    .join(' · ');

export { describeDownloadProgress };
