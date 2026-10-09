import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';

/**
 * Whether a series request wants a season: every regular season where it named none, and otherwise
 * the seasons it named, Specials only where named, and any regular season after the last one there
 * was when they were chosen where it follows new seasons.
 *
 * @param request - The request.
 * @param season - The season's number, 0 for Specials.
 * @returns Whether it is wanted.
 */
const isSeasonWanted = (
  request: Pick<MediaRequestRecord, 'seasons' | 'followsNewSeasons' | 'followsAfter'>,
  season: number,
): boolean => {
  if (request.seasons === null) {
    return season > 0;
  }

  return (
    request.seasons.includes(season) ||
    (season > 0 &&
      request.followsNewSeasons &&
      request.followsAfter !== null &&
      season > request.followsAfter)
  );
};

export { isSeasonWanted };
