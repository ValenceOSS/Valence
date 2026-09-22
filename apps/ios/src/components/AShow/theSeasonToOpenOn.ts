import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type ASeason = ShowDetail['seasons'][number];

/**
 * Which season a programme should open on, which is the one somebody is up to.
 *
 * That is the first season with an episode they have not finished, counting one they never started
 * as not finished. Opening on season one of a programme somebody is five seasons into makes them
 * scroll past everything they have already seen to find the thing they came for.
 *
 * Specials are skipped over when deciding, since nobody works through a programme by way of its
 * extras, but are opened on where they are all there is.
 *
 * @param seasons - The programme's seasons, in the order the library gave them.
 * @param progress - How far through each episode they are.
 * @returns The season to show first, or nothing where the programme has none.
 */
const theSeasonToOpenOn = (
  seasons: readonly ASeason[],
  progress: ReadonlyMap<string, WatchProgress>,
): ASeason | null => {
  const proper = seasons.filter((season) => season.seasonNumber !== 0);
  const inOrder = proper.length > 0 ? proper : [...seasons];

  return (
    inOrder.find((season) =>
      season.episodes.some((episode) => progress.get(episode.id)?.isFinished !== true),
    ) ??
    inOrder[0] ??
    null
  );
};

export { theSeasonToOpenOn };
