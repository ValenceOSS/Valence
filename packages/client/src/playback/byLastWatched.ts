import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

/**
 * Orders things by when somebody last had them on, most recent first.
 *
 * Something never watched sorts last rather than first, so a list of what to carry on with never
 * opens on a thing nobody has started.
 *
 * @param progress - How far through each thing they are, and when they last were.
 * @returns A comparison to sort by.
 */
const byLastWatched =
  (progress: ReadonlyMap<string, WatchProgress>) =>
  (left: MediaSummary, right: MediaSummary): number =>
    (Date.parse(progress.get(right.id)?.updatedAt ?? '') || 0) -
    (Date.parse(progress.get(left.id)?.updatedAt ?? '') || 0);

export { byLastWatched };
