import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Finds the other episodes of the same season as one episode, which is what the player's episode
 * list is built from.
 *
 * @param items - Everything known about the library.
 * @param of - The episode being watched.
 * @returns Its siblings, in the order they are watched.
 */
const findSiblings = (items: MediaSummary[], of: MediaSummary): MediaSummary[] => {
  const series = of.seriesTitle ?? null;

  if (series === null) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item.id !== of.id &&
        item.seriesTitle === series &&
        (item.seasonNumber ?? null) === (of.seasonNumber ?? null),
    )
    .sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0));
};

export { findSiblings };
