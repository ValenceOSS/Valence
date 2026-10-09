import type { ShowDetail } from '@ValenceContracts/schemas/Show';

/**
 * Whether the catalogue lists regular episodes of a show that have aired and that the library does
 * not hold, so more of it could be asked for. Nothing is missing where the catalogue's shape of it
 * is not known.
 *
 * @param show - The show as the library has it.
 * @param today - Today, as a calendar day.
 * @returns Whether anything aired is missing.
 */
const isShowMissingEpisodes = (
  show: Pick<ShowDetail, 'seasons' | 'shape'>,
  today: string,
): boolean =>
  (show.shape ?? []).some((season) => {
    if (season.seasonNumber === 0) {
      return false;
    }

    const aired =
      season.episodes.length === 0
        ? season.episodeCount
        : season.episodes.filter(
            (episode) =>
              episode.airDate !== null && episode.airDate !== undefined && episode.airDate <= today,
          ).length;
    const held =
      show.seasons.find((one) => one.seasonNumber === season.seasonNumber)?.episodes.length ?? 0;

    return aired > held;
  });

export { isShowMissingEpisodes };
