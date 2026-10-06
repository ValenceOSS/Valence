import { episodeNumbersOf } from '@ValenceCore/functions/episodeNumbersOf';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

/**
 * Whether whoever is watching has seen a programme through: every episode this server holds of it
 * watched to the end, and, where the catalogue says what it is, every episode that has aired in
 * every season held and watched too. A first season finished is not the programme finished while a
 * second has aired, whether or not the second is here yet. Specials do not count, and nor does an
 * episode still to air.
 *
 * @param show - The programme, with the catalogue's shape of it where one was fetched.
 * @param isFinished - Whether this viewer has watched an episode to the end.
 * @param today - Today, as `2026-10-06`, for telling what has aired.
 * @returns Whether it is watched through.
 */
const isWatchedThrough = (
  show: Pick<ShowDetail, 'seasons' | 'shape'>,
  isFinished: (mediaId: string) => boolean,
  today: string,
): boolean => {
  const held = show.seasons.flatMap((season) => season.episodes);

  if (held.length === 0 || !held.every((episode) => isFinished(episode.id))) {
    return false;
  }

  const heldNumbers = (seasonNumber: number): ReadonlySet<number> =>
    new Set(
      (show.seasons.find((season) => season.seasonNumber === seasonNumber)?.episodes ?? []).flatMap(
        ({ episodeNumber, episodeNumberEnd }) =>
          episodeNumber === null || episodeNumber === undefined
            ? []
            : episodeNumbersOf(episodeNumber, episodeNumberEnd ?? null),
      ),
    );

  return (show.shape ?? [])
    .filter((season) => season.seasonNumber > 0)
    .every((season) => {
      const here = heldNumbers(season.seasonNumber);

      return season.episodes
        .filter(
          (episode) =>
            episode.airDate !== null &&
            episode.airDate !== undefined &&
            episode.airDate.slice(0, 10) <= today,
        )
        .every((episode) => here.has(episode.episodeNumber));
    });
};

export { isWatchedThrough };
