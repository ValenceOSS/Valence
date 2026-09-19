import type { Release } from '@ValenceContracts/schemas/Indexer';

/**
 * Puts releases in the order somebody choosing one reads them: the most widely shared first, since
 * that is the one most likely to finish, and the newest among those that share equally. Usenet
 * releases, which have no sharers, sort among themselves by how often they have been fetched.
 *
 * @param releases - What every indexer found.
 * @returns The same releases, in order.
 */
const inReleaseOrder = (releases: readonly Release[]): Release[] =>
  releases.toSorted((left, right) => {
    const reach = (release: Release) => release.seeders ?? release.grabs ?? -1;
    const posted = (release: Release) =>
      release.publishedAt === null ? 0 : Date.parse(release.publishedAt);

    return reach(right) - reach(left) || posted(right) - posted(left);
  });

export { inReleaseOrder };
