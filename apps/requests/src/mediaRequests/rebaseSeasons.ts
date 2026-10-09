import { highestSeasonOf } from '@ValenceRequests/mediaRequests/highestSeasonOf';
import { isSeasonWanted } from '@ValenceRequests/mediaRequests/isSeasonWanted';
import type { CatalogueEpisode } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

type SeasonChoice = Pick<MediaRequestRecord, 'seasons' | 'followsNewSeasons' | 'followsAfter'>;

/**
 * What a series request wants, said against the seasons the catalogue lists now: every season it
 * wants named, new ones it has picked up since included, and the last season there is now to tell
 * new ones by, so that changing what it asks for never lets go of a season it was following. Every
 * season becomes each season named and following new ones. Unchanged where the catalogue lists
 * nothing.
 *
 * @param request - What the request wants now.
 * @param episodes - Every episode the catalogue knows of.
 * @returns The same choice, said again.
 */
const rebaseSeasons = (
  request: SeasonChoice,
  episodes: readonly Pick<CatalogueEpisode, 'season'>[],
): SeasonChoice => {
  const listed = [...new Set(episodes.map((episode) => episode.season))];

  if (listed.length === 0) {
    return request;
  }

  const wanted = new Set([
    ...(request.seasons ?? []),
    ...listed.filter((season) => isSeasonWanted(request, season)),
  ]);

  return {
    seasons: [...wanted].toSorted((left, right) => left - right),
    followsNewSeasons: request.seasons === null || request.followsNewSeasons,
    followsAfter: highestSeasonOf(episodes) ?? request.followsAfter,
  };
};

export { rebaseSeasons };
