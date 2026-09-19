import type { CatalogueEpisode, CatalogueSeason } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The seasons a series has, from its episodes: how many episodes each holds and the day the first
 * aired, specials first.
 *
 * @param episodes - Every episode the catalogue knows of.
 * @returns The seasons, in order.
 */
const seasonsOf = (episodes: readonly CatalogueEpisode[]): CatalogueSeason[] => {
  const seasons = new Map<number, CatalogueSeason>();

  for (const episode of episodes) {
    const kept = seasons.get(episode.season);
    const aired = [kept?.firstAired ?? null, episode.airDate]
      .filter((date) => date !== null)
      .toSorted()[0];

    seasons.set(episode.season, {
      season: episode.season,
      episodeCount: (kept?.episodeCount ?? 0) + 1,
      firstAired: aired ?? null,
    });
  }

  return [...seasons.values()].toSorted((left, right) => left.season - right.season);
};

export { seasonsOf };
