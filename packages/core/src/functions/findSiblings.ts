import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { isSameSeries } from '@ValenceCore/functions/isSameSeries';

/**
 * Finds the other episodes of the same season as one episode, which is what the player's episode
 * list is built from.
 *
 * @param items - Everything known about the library.
 * @param of - The episode being watched.
 * @returns Its siblings, in the order they are watched.
 */
const findSiblings = (items: MediaSummary[], of: MediaSummary): MediaSummary[] => {
  return items
    .filter(
      (item) =>
        item.id !== of.id &&
        isSameSeries(item, of) &&
        (item.seasonNumber ?? null) === (of.seasonNumber ?? null),
    )
    .sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0));
};

export { findSiblings };
