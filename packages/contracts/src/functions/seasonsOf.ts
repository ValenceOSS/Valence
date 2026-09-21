import type {
  CatalogueEpisode,
  CatalogueSeason,
  RequestItem,
  SeasonStanding,
} from '@ValenceContracts/schemas/MediaRequest';

type Asked = Pick<RequestItem, 'season' | 'state'>;

const HERE = new Set(['filed', 'available']);

/**
 * Where a season stands for whoever is about to ask for it: nothing asked of it, asked and still
 * on its way, some of it here, or every episode of it here.
 *
 * Only what Valence was asked for is counted. A season sitting in the library that nobody asked
 * Valence to fetch is not known about here, and reads as one nobody has asked for.
 *
 * @param items - What has been asked of this season.
 * @param episodeCount - How many episodes the season holds.
 * @returns Where it stands.
 */
const standingOf = (items: readonly Asked[], episodeCount: number): SeasonStanding => {
  if (items.length === 0) {
    return 'askable';
  }

  const here = items.filter((item) => HERE.has(item.state));

  if (here.length === 0) {
    return 'requested';
  }

  return here.length >= episodeCount ? 'library' : 'partly';
};

/**
 * The seasons a series has, from its episodes: how many episodes each holds, the day the first
 * aired, and where each stands against what has already been asked for. Specials first.
 *
 * @param episodes - Every episode the catalogue knows of.
 * @param requests - What has been asked of this series, where that is known.
 * @returns The seasons, in order.
 */
const seasonsOf = (
  episodes: readonly CatalogueEpisode[],
  requests: readonly { items: readonly Asked[] }[] = [],
): CatalogueSeason[] => {
  const seasons = new Map<number, CatalogueSeason>();
  const asked = requests.flatMap((request) => request.items);

  for (const episode of episodes) {
    const kept = seasons.get(episode.season);
    const aired = [kept?.firstAired ?? null, episode.airDate]
      .filter((date) => date !== null)
      .toSorted()[0];

    seasons.set(episode.season, {
      season: episode.season,
      episodeCount: (kept?.episodeCount ?? 0) + 1,
      firstAired: aired ?? null,
      standing: 'askable',
    });
  }

  return [...seasons.values()]
    .map((season) => ({
      ...season,
      standing: standingOf(
        asked.filter((item) => item.season === season.season),
        season.episodeCount,
      ),
    }))
    .toSorted((left, right) => left.season - right.season);
};

export type { Asked };

export { seasonsOf };
