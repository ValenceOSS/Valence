import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * How the downloads a viewer's requests are waiting on are coming along — and nothing of anybody
 * else's: how far each has got, how fast, and how long is left.
 *
 * @param requests - The viewer's requests.
 * @param downloads - Every download the requests service is following.
 * @returns Each download of theirs, as it is going.
 */
const progressOf = (
  requests: readonly Pick<MediaRequest, 'items'>[],
  downloads: readonly QueuedDownload[],
): RequestProgress[] => {
  const theirs = new Set(
    requests.flatMap((request) =>
      request.items.flatMap((item) => (item.downloadId === null ? [] : [item.downloadId])),
    ),
  );

  return downloads
    .filter((download) => theirs.has(download.id))
    .map((download) => ({
      downloadId: download.id,
      state: download.state,
      progress: download.progress,
      sizeBytes: download.sizeBytes,
      doneBytes: download.doneBytes,
      downloadBytesPerSecond: download.downloadBytesPerSecond,
      secondsLeft: download.secondsLeft,
    }));
};

export { progressOf };
