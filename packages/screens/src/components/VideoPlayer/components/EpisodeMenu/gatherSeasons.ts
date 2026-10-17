import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { EpisodeSeason } from './EpisodeMenu.types';

/**
 * Says where a season sits in the list: numbered seasons in order, then the specials, then anything
 * the scanner could not place in a season at all.
 *
 * @param seasonNumber - The season, where it is known.
 * @returns Its place, lowest first.
 */
const placeOf = (seasonNumber: number | null): number => {
  if (seasonNumber === null) {
    return Number.MAX_SAFE_INTEGER;
  }

  return seasonNumber === 0 ? Number.MAX_SAFE_INTEGER - 1 : seasonNumber;
};

/**
 * Sorts a programme's episodes into its seasons, each season's episodes in order.
 *
 * @param episodes - Every episode of the programme, in any order.
 * @returns The seasons, in the order they are offered.
 */
const gatherSeasons = (episodes: readonly MediaSummary[]): EpisodeSeason[] => {
  const bySeason = new Map<number | null, MediaSummary[]>();

  for (const episode of episodes) {
    const seasonNumber = episode.seasonNumber ?? null;

    const held = bySeason.get(seasonNumber);

    if (held === undefined) {
      bySeason.set(seasonNumber, [episode]);
    } else {
      held.push(episode);
    }
  }

  return [...bySeason.entries()]
    .map(([seasonNumber, held]) => ({
      seasonNumber,
      episodes: held.sort((left, right) => (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0)),
    }))
    .sort((left, right) => placeOf(left.seasonNumber) - placeOf(right.seasonNumber));
};

export { gatherSeasons };
