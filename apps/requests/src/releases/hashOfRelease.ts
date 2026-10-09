import { readMagnetHash } from '@ValenceRequests/downloads/readMagnetHash';
import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * A torrent's info hash, in lower-case hex, from what the indexer said of it or from its magnet
 * link, so the same torrent is known under whatever name it is posted.
 *
 * @param release - The release.
 * @returns The hash, or nothing for a release that is not a torrent or carries none.
 */
const hashOfRelease = (
  release: Pick<Release, 'protocol' | 'infoHash' | 'magnetUrl'>,
): string | null => {
  if (release.protocol !== 'torrent') {
    return null;
  }

  const said = release.infoHash?.trim().toLowerCase() ?? '';

  if (/^[a-f0-9]{40}$/u.test(said)) {
    return said;
  }

  return release.magnetUrl === null ? null : readMagnetHash(release.magnetUrl);
};

export { hashOfRelease };
