import type { MediaSummary } from '@ValenceContracts/schemas/Library';

import { collapseToShows } from '@ValenceCore/functions/collapseToShows';

/**
 * Picks a handful of things to put at the front of a library, at random rather than newest first,
 * so the front of a library is a reason to look around rather than a list of what arrived last.
 *
 * Collapsed before it is shuffled, not after, so that chance is per title rather than per file. A
 * library is mostly episodes, and shuffling files would make a programme with thirteen of them
 * thirteen times likelier to be chosen than a film — the front page would be all series.
 *
 * @param items - Everything the library holds.
 * @param limit - How many to choose.
 * @param random - Where chance comes from, which a test replaces to know what it will get.
 * @returns The items to feature.
 */
const pickFeatured = (
  items: MediaSummary[],
  limit: number,
  random: () => number = Math.random,
): MediaSummary[] => {
  const pool = collapseToShows(items);

  for (let at = pool.length - 1; at > 0; at -= 1) {
    const swap = Math.floor(random() * (at + 1));
    const held = pool[at];
    const other = pool[swap];

    if (held !== undefined && other !== undefined) {
      pool[at] = other;
      pool[swap] = held;
    }
  }

  return pool.slice(0, limit);
};

export { pickFeatured };
