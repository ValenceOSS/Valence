import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

type RequestDownload = {
  downloadId: string;
  releaseTitle: string;
  items: RequestItem[];
  queued: Pick<
    QueuedDownload,
    | 'state'
    | 'wasPaused'
    | 'progress'
    | 'secondsLeft'
    | 'sizeBytes'
    | 'downloadBytesPerSecond'
    | 'uploadBytesPerSecond'
    | 'clientName'
    | 'indexerName'
    | 'sentAt'
  > | null;
};

/**
 * What a request has downloading, one row a download, with everything it holds and how the
 * download client says it is going: a season pack and single episodes side by side.
 *
 * @param request - The request.
 * @param queue - Every download the clients have.
 * @returns Its downloads, in the order they were sent.
 */
const downloadsOfRequest = (
  request: Pick<MediaRequest, 'items'>,
  queue: readonly QueuedDownload[],
): RequestDownload[] => {
  const byDownload = new Map<string, RequestItem[]>();

  for (const item of request.items) {
    if (
      item.downloadId !== null &&
      (item.state === 'chosen' || item.state === 'downloading' || item.state === 'filing')
    ) {
      byDownload.set(item.downloadId, [...(byDownload.get(item.downloadId) ?? []), item]);
    }
  }

  return [...byDownload]
    .map(([downloadId, items]) => ({
      downloadId,
      releaseTitle: items[0]?.releaseTitle ?? '',
      items,
      queued: queue.find((one) => one.id === downloadId) ?? null,
    }))
    .toSorted((left, right) =>
      (left.queued?.sentAt ?? '').localeCompare(right.queued?.sentAt ?? ''),
    );
};

export type { RequestDownload };

export { downloadsOfRequest };
