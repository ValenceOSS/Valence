import { hashOfRelease } from '@ValenceRequests/releases/hashOfRelease';
import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * Releases with each one kept once where more than one indexer found it: the same torrent by its
 * info hash, and anything else by its name and size. The first of each is kept, so releases listed
 * by the indexers asked first keep theirs.
 *
 * @param releases - The releases, in the order their indexers are asked.
 * @returns The releases, each once.
 */
const withoutRepeats = (releases: readonly Release[]): Release[] => {
  const seen = new Set<string>();

  return releases.filter((release) => {
    const key =
      hashOfRelease(release) ??
      `${release.protocol}:${release.title.toLowerCase()}:${release.sizeBytes?.toString() ?? '?'}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
};

export { withoutRepeats };
