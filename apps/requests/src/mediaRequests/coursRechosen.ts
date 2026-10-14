import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';
import type { AnimeFacts } from '@ValenceContracts/schemas/Anime';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * The cours an anime request wants once its cours are worked out differently, so the same episodes
 * are wanted as before: each new cour holding an episode an old cour it wanted held, and the last
 * cour there is now to tell new ones by. Nothing where it named no cours, since every cour is still
 * every cour.
 *
 * @param kept - The request as it was, with its cours as they were.
 * @param next - Its cours as they are worked out now.
 * @returns The cours it wants now, or null where they need no saying again.
 */
const coursRechosen = (
  kept: Pick<MediaRequestRecord, 'seasons' | 'followsNewSeasons' | 'followsAfter' | 'anime'>,
  next: AnimeFacts,
): Pick<MediaRequestRecord, 'seasons' | 'followsAfter'> | null => {
  const before = kept.anime ?? null;

  if (before === null || kept.seasons === null) {
    return null;
  }

  const wanted = before.episodes.filter((one) => isSeasonWanted(kept, one.cour));
  const seasons = [
    ...new Set(
      wanted.flatMap((one) => {
        const now = next.episodes.find(
          (other) => other.season === one.season && other.episode === one.episode,
        );

        return now === undefined ? [] : [now.cour];
      }),
    ),
  ].toSorted((left, right) => left - right);
  const regular = next.cours.map((cour) => cour.cour);

  return {
    seasons,
    followsAfter: regular.length === 0 ? kept.followsAfter : Math.max(...regular),
  };
};

export { coursRechosen };
