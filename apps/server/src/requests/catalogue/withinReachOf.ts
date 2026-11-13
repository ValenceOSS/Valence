import type { CatalogueLookup } from '@ValenceServer/requests/catalogue/CatalogueLookup';

type Reach = {
  isItemOutOfReach: (mediaId: string) => Promise<boolean>;
  isSeriesOutOfReach: (seriesId: string) => Promise<boolean>;
};

/**
 * The titles Valence holds among a set, less those something is held back from somebody: a library
 * an administrator kept from them, or an age they are held to.
 *
 * @param held - What was found, each title's catalogue id with the id of what holds it.
 * @param isOutOfReach - Whether what holds a title is held back from them.
 * @returns What they may be told is held.
 */
const reachableOf = async <Held>(
  held: ReadonlyMap<string, Held>,
  isOutOfReach: (found: Held) => Promise<boolean>,
): Promise<ReadonlyMap<string, Held>> => {
  const entries = [...held];
  const refused = await Promise.all(entries.map(([, found]) => isOutOfReach(found)));

  return new Map(entries.filter((_entry, index) => refused[index] === false));
};

/**
 * A lookup that tells of a film, series or title on a linked server only where somebody may reach
 * it, so a title they are refused stands as one that is not held, and its id and who asked for it
 * are not given away.
 *
 * @param lookup - The library, looked into.
 * @param reach - Whether an item or a programme is out of reach of the person looking.
 * @returns The lookup, as that person may see it.
 */
const withinReachOf = (lookup: CatalogueLookup, reach: Reach): CatalogueLookup => ({
  ...lookup,
  films: async (tmdbIds) =>
    reachableOf(await lookup.films(tmdbIds), (mediaId) => reach.isItemOutOfReach(mediaId)),
  series: async (tmdbIds) =>
    reachableOf(await lookup.series(tmdbIds), (seriesId) => reach.isSeriesOutOfReach(seriesId)),
  elsewhere: async (tmdbIds) =>
    reachableOf(
      await lookup.elsewhere(tmdbIds),
      async (found) =>
        (await reach.isItemOutOfReach(found.mediaId)) ||
        (await reach.isSeriesOutOfReach(found.mediaId)),
    ),
});

export type { Reach };

export { withinReachOf };
