import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

/**
 * How far along a request's downloads are, together: what has arrived of what they hold, how fast
 * they are coming altogether, and how long the slowest of them has left.
 *
 * @param request - The request.
 * @param progress - How each download being followed is going.
 * @returns Its progress, or null where nothing of it is downloading.
 */
const progressOfRequest = (
  request: Pick<MediaRequest, 'items'>,
  progress: readonly RequestProgress[],
): RequestProgress | null => {
  const ids = new Set(
    request.items.flatMap((item) =>
      item.state === 'downloading' && item.downloadId !== null ? [item.downloadId] : [],
    ),
  );
  const going = progress.filter((one) => ids.has(one.downloadId));
  const [first] = going;

  if (first === undefined) {
    return null;
  }

  const sum = (read: (one: RequestProgress) => number | null): number | null =>
    going.some((one) => read(one) === null)
      ? null
      : going.reduce((total, one) => total + (read(one) ?? 0), 0);
  const sizeBytes = sum((one) => one.sizeBytes);
  const doneBytes = sum((one) => one.doneBytes);
  const lefts = going.map((one) => one.secondsLeft);

  return {
    downloadId: first.downloadId,
    state: first.state,
    progress:
      sizeBytes !== null && doneBytes !== null && sizeBytes > 0
        ? Math.min(doneBytes / sizeBytes, 1)
        : going.reduce((total, one) => total + one.progress, 0) / going.length,
    sizeBytes,
    doneBytes,
    downloadBytesPerSecond: sum((one) => one.downloadBytesPerSecond),
    secondsLeft: lefts.some((left) => left === null)
      ? null
      : Math.max(...lefts.map((left) => left ?? 0)),
  };
};

export { progressOfRequest };
