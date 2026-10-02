import type { CollectionEntry, CollectionOrder } from '@ValenceContracts/schemas/Collection';

/**
 * What an entry is called: a programme by its own name rather than by the episode standing for it.
 *
 * @param entry - An entry of a collection.
 * @returns Its name.
 */
const nameOf = (entry: CollectionEntry): string =>
  entry.kind === 'series' ? (entry.media.seriesTitle ?? entry.media.title) : entry.media.title;

/**
 * Lays a collection's entries out in the order somebody asked for: as whoever made it placed them,
 * oldest first by the year each came out, or by name. Anything with no year goes after everything
 * with one, and titles from the same year go by name.
 *
 * @param entries - The entries, in their placed order.
 * @param order - How to lay them out.
 * @returns The entries in that order, leaving what was given as it was.
 */
const arrangeCollection = (
  entries: readonly CollectionEntry[],
  order: CollectionOrder,
): CollectionEntry[] => {
  if (order === 'position') {
    return [...entries];
  }

  const byName = (left: CollectionEntry, right: CollectionEntry): number =>
    nameOf(left).localeCompare(nameOf(right), undefined, { sensitivity: 'base', numeric: true });

  if (order === 'title') {
    return [...entries].sort(byName);
  }

  return [...entries].sort((left, right) => {
    const leftYear = left.media.year ?? Number.POSITIVE_INFINITY;
    const rightYear = right.media.year ?? Number.POSITIVE_INFINITY;

    return leftYear === rightYear ? byName(left, right) : leftYear - rightYear;
  });
};

export { arrangeCollection };
