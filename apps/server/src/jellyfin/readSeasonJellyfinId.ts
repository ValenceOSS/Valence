import { SEASON_PREFIX_DIGITS } from '@ValenceServer/jellyfin/seasonPrefixOf';
import { UNNUMBERED_SEASON } from '@ValenceServer/jellyfin/UNNUMBERED_SEASON';

/**
 * Reads a season identifier back into its programme's digits and the season's number.
 *
 * @param id - A season identifier.
 * @returns The programme's digits and the season, which is nothing for an unnumbered one.
 */
const readSeasonJellyfinId = (id: string): { prefix: string; seasonNumber: number | null } => {
  const read = Number.parseInt(id.slice(SEASON_PREFIX_DIGITS), 16);

  return {
    prefix: id.slice(0, SEASON_PREFIX_DIGITS),
    seasonNumber: Number.isNaN(read) || read === UNNUMBERED_SEASON ? null : read,
  };
};

export { readSeasonJellyfinId };
