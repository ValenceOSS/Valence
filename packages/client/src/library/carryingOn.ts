import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { UpNext } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';
import { isOnContinueWatching } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Puts together what somebody is in the middle of: the things they stopped part way through, and
 * the next episode of each programme they finished an episode of, most recently watched first and
 * each only once, leaving out what they took off the row.
 *
 * @param resuming - What they stopped part way through.
 * @param progress - How far through each thing they are, and when they last were.
 * @param upNext - The next episode of each programme they are part way through, with when the one
 *   before it was last watched.
 * @returns Everything to carry on with, in the order to offer it.
 */
const carryingOn = (
  resuming: readonly MediaSummary[],
  progress: Map<string, WatchProgress>,
  upNext: UpNext['episodes'],
): MediaSummary[] => {
  const seen = new Set<string>();

  return [
    ...resuming
      .filter((item) => {
        const known = progress.get(item.id);

        return known === undefined || isOnContinueWatching(known);
      })
      .map((item) => ({
        item,
        atMs: Date.parse(progress.get(item.id)?.updatedAt ?? '') || 0,
      })),
    ...upNext.map(({ episode, lastWatchedAt }) => ({
      item: episode,
      atMs: Date.parse(lastWatchedAt) || 0,
    })),
  ]
    .sort((left, right) => right.atMs - left.atMs)
    .flatMap(({ item }) => {
      if (seen.has(item.id)) {
        return [];
      }

      seen.add(item.id);

      return [item];
    });
};

export { carryingOn };
