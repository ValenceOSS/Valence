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
 * A season counts as here once the library holds every episode of it, whether Valence fetched
 * them or they were already on the shelf. What Valence filed and what the library holds are the
 * same episodes seen twice, so the larger of the two is taken rather than the sum.
 *
 * @param items - What has been asked of this season.
 * @param episodeCount - How many episodes the season holds.
 * @param heldCount - How many of them the library holds.
 * @returns Where it stands.
 */
const standingOf = (
  items: readonly Asked[],
  episodeCount: number,
  heldCount: number,
): SeasonStanding => {
  const filed = items.filter((item) => HERE.has(item.state)).length;
  const here = Math.max(filed, heldCount);

  if (here >= episodeCount && episodeCount > 0) {
    return 'library';
  }

  if (here > 0) {
    return 'partly';
  }

  return items.length === 0 ? 'askable' : 'requested';
};

/**
 * The seasons a series has, from its episodes: how many episodes each holds, the day the first
 * aired, and where each stands — against what has already been asked for, and against what the
 * library holds of it already. Specials first.
 *
 * @param episodes - Every episode the catalogue knows of.
 * @param requests - What has been asked of this series, where that is known.
 * @param held - How many episodes of each season the library holds, by season number.
 * @returns The seasons, in order.
 */
const seasonsOf = (
  episodes: readonly CatalogueEpisode[],
  requests: readonly { items: readonly Asked[] }[] = [],
  held: ReadonlyMap<number, number> = new Map(),
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
        held.get(season.season) ?? 0,
      ),
    }))
    .toSorted((left, right) => left.season - right.season);
};

export type { Asked };

export { seasonsOf };
