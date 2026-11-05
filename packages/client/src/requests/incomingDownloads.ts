import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

type IncomingDownloads = {
  count: number;
  totalBytes: number;
  doneBytes: number;
  unsizedCount: number;
};

/**
 * Adds up the downloads that have not reached a library yet: those finished or given up on are left
 * out, and those whose client has not said how large they are only counted, since a guess at their
 * size would be worse than saying it is not known.
 *
 * @param downloads - Every download in the queue.
 * @returns How many are still coming, how large they are together and how much of that has arrived.
 */
const incomingDownloads = (downloads: readonly QueuedDownload[]): IncomingDownloads => {
  const coming = downloads.filter(({ state }) => state !== 'done' && state !== 'failed');
  const sized = coming.flatMap(({ sizeBytes, doneBytes }) =>
    sizeBytes === null || sizeBytes === 0
      ? []
      : [{ sizeBytes, doneBytes: Math.min(doneBytes ?? 0, sizeBytes) }],
  );

  return {
    count: coming.length,
    totalBytes: sized.reduce((sum, { sizeBytes }) => sum + sizeBytes, 0),
    doneBytes: sized.reduce((sum, { doneBytes }) => sum + doneBytes, 0),
    unsizedCount: coming.length - sized.length,
  };
};

export type { IncomingDownloads };

export { incomingDownloads };
