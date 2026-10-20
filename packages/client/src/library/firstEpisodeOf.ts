import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';

/**
 * A programme's first episode: the first of its earliest numbered season, leaving specials aside
 * however a server lists them, since a special is rarely where a programme starts and can as easily
 * come from its end. Where it holds only specials, or seasons with no number, the first of those.
 *
 * @param show - The programme and its episodes.
 * @returns The episode, or null where it has none.
 */
const firstEpisodeOf = (show: ShowDetail): MediaSummary | null => {
  const numbered = show.seasons
    .filter((season) => (season.seasonNumber ?? 0) >= 1 && season.episodes.length > 0)
    .sort((left, right) => (left.seasonNumber ?? 0) - (right.seasonNumber ?? 0));

  return numbered[0]?.episodes[0] ?? show.seasons.flatMap((season) => season.episodes)[0] ?? null;
};

export { firstEpisodeOf };
