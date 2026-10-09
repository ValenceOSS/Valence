import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The last regular season the catalogue lists for a series, so that any after it can be told apart
 * as new. Nothing where it lists no regular season.
 *
 * @param episodes - Every episode the catalogue knows of.
 * @returns The season's number, or null.
 */
const highestSeasonOf = (episodes: readonly Pick<CatalogueEpisode, 'season'>[]): number | null => {
  const regular = episodes.map((episode) => episode.season).filter((season) => season > 0);

  return regular.length === 0 ? null : Math.max(...regular);
};

export { highestSeasonOf };
