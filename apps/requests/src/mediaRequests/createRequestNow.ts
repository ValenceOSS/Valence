import type { QueuedDownloadState } from '@ValenceContracts/schemas/DownloadQueue';
import type { RequestNow } from '@ValenceContracts/schemas/RequestNow';
import type { DownloadQueueService } from '@ValenceRequests/downloads/createDownloadQueue';
import type { SentDownloadStore } from '@ValenceRequests/downloads/SentDownloadRecord';
import type { MediaRequestStore } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

type CreateRequestNowOptions = {
  requests: Pick<MediaRequestStore, 'find'>;
  downloads: Pick<SentDownloadStore, 'list'>;
  queue: Pick<DownloadQueueService, 'queue'>;
};

const DOWNLOADING: ReadonlySet<QueuedDownloadState> = new Set([
  'queued',
  'metadata',
  'downloading',
  'stalled',
  'paused',
]);

/**
 * What a request is doing right now: which indexers its search is asking, how its newest download
 * is coming along as its client last said, or what it is filing into the library.
 *
 * @param requests - The requests.
 * @param downloads - Every download sent, to find the request's own.
 * @param queue - The download queue, for how fast each is going and how long is left.
 * @returns A reader of what one request is doing, `null` when it is doing nothing.
 */
const createRequestNow =
  ({ requests, downloads, queue }: CreateRequestNowOptions) =>
  async (requestId: string): Promise<RequestNow> => {
    const request = await requests.find(requestId);

    if (request === null) {
      return null;
    }

    if (request.searching !== undefined && request.searching !== null) {
      return { stage: 'search', ...request.searching };
    }

    const [newest] = (await downloads.list())
      .filter((download) => download.requestId === requestId)
      .toSorted((left, right) => right.sentAt.localeCompare(left.sentAt));

    if (newest === undefined) {
      return null;
    }

    if (newest.state === 'processing') {
      return { stage: 'import', title: newest.title };
    }

    if (!DOWNLOADING.has(newest.state)) {
      return null;
    }

    const shown = (await queue.queue()).downloads.find((download) => download.id === newest.id);

    return shown === undefined
      ? null
      : {
          stage: 'download',
          title: shown.title,
          clientName: shown.clientName,
          downloadId: shown.id,
          state: shown.state,
          progress: shown.progress,
          sizeBytes: shown.sizeBytes,
          doneBytes: shown.doneBytes,
          downloadBytesPerSecond: shown.downloadBytesPerSecond,
          secondsLeft: shown.secondsLeft,
        };
  };

export { createRequestNow };
