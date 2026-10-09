import type { ShowDetail } from '@ValenceContracts/schemas/Show';

/**
 * Whether the catalogue lists regular episodes of a show that have aired and that the library does
 * not hold, by their numbers — or, where the catalogue does not list a season's episodes, more in it
 * than the library holds — so more of it could be asked for. Nothing is missing where the
 * catalogue's shape of it is not known.
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

    const held =
      show.seasons.find((one) => one.seasonNumber === season.seasonNumber)?.episodes ?? [];

    if (season.episodes.length === 0) {
      return season.episodeCount > held.length;
    }

    const heldNumbers = new Set(held.map((episode) => episode.episodeNumber));

    return season.episodes.some(
      (episode) =>
        episode.airDate !== null &&
        episode.airDate !== undefined &&
        episode.airDate <= today &&
        !heldNumbers.has(episode.episodeNumber),
    );
  });

export { isShowMissingEpisodes };
