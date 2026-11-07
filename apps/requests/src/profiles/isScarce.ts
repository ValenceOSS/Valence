import type { Release } from '@ValenceContracts/schemas/Indexer';

const FEWEST_SEEDERS = 3;

/**
 * Whether a torrent is shared by so few that it may never arrive: a seeder or two, as an indexer
 * last counted them, are often gone by the time it starts.
 *
 * @param release - The release.
 * @returns Whether it is that scarce, which a usenet release or an unknown count never is.
 */
const isScarce = (release: Pick<Release, 'protocol' | 'seeders'>): boolean =>
  release.protocol === 'torrent' && release.seeders !== null && release.seeders < FEWEST_SEEDERS;

export { isScarce };
