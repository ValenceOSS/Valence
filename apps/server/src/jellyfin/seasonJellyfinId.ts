import { seasonPrefixOf } from '@ValenceServer/jellyfin/seasonPrefixOf';
import { UNNUMBERED_SEASON } from '@ValenceServer/jellyfin/UNNUMBERED_SEASON';

const NUMBER_DIGITS = 4;

/**
 * A Jellyfin identifier for one season of a programme: the programme's own share of the digits and
 * the season's number in the last four.
 *
 * @param showKey - What identifies the programme, as its library and the programme together.
 * @param seasonNumber - The season, or nothing for episodes the catalogue gave no season.
 * @returns Thirty-two hexadecimal digits.
 */
const seasonJellyfinId = (showKey: string, seasonNumber: number | null): string =>
  `${seasonPrefixOf(showKey)}${(seasonNumber ?? UNNUMBERED_SEASON).toString(16).padStart(NUMBER_DIGITS, '0')}`;

export { seasonJellyfinId };
