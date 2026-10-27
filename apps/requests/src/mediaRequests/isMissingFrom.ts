import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

/**
 * Whether a release is one a film or episode was found not to be in, once its files were seen — by
 * its name, or by its torrent's hash under any other name it is posted as.
 *
 * @param item - The film or episode.
 * @param title - The release's name.
 * @param infoHash - The release's torrent hash, where it has one.
 * @returns Whether it was missing from it.
 */
const isMissingFrom = (
  item: Pick<RequestItemRecord, 'missingFrom'>,
  title: string,
  infoHash: string | null,
): boolean =>
  (item.missingFrom ?? []).some(
    (release) =>
      release.title.toLowerCase() === title.toLowerCase() ||
      (infoHash !== null && release.infoHash === infoHash.toLowerCase()),
  );

export { isMissingFrom };
