import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The seasons a series is asked for, said so that following new seasons is its own choice: every
 * season stays every season where new ones are followed, and otherwise becomes each regular season
 * the catalogue lists now, since every season would take in the ones still to come. Every season
 * stays as it is where the catalogue lists nothing to name.
 *
 * @param seasons - The seasons asked for, null for every season.
 * @param followsNewSeasons - Whether new seasons are followed.
 * @param episodes - Every episode the catalogue knows of.
 * @returns The seasons, null for every season.
 */
const seasonsChosen = (
  seasons: number[] | null,
  followsNewSeasons: boolean,
  episodes: readonly Pick<CatalogueEpisode, 'season'>[],
): number[] | null =>
  seasons !== null || followsNewSeasons || episodes.length === 0
    ? seasons
    : [...new Set(episodes.map((episode) => episode.season))]
        .filter((season) => season > 0)
        .toSorted((left, right) => left - right);

export { seasonsChosen };
