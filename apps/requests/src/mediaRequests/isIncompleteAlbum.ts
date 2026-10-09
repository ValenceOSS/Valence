import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * Whether an album was filed with fewer tracks than its longest edition has, so a complete copy is
 * still wanted.
 *
 * @param item - The album.
 * @returns Whether it is short.
 */
const isIncompleteAlbum = (
  item: Pick<RequestItemRecord, 'trackCount' | 'filedTrackCount'>,
): boolean =>
  (item.trackCount ?? null) !== null &&
  (item.filedTrackCount ?? null) !== null &&
  (item.filedTrackCount ?? 0) < (item.trackCount ?? 0);

export { isIncompleteAlbum };
