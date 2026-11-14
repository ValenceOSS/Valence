import { syntheticJellyfinId } from '@ValenceServer/jellyfin/syntheticJellyfinId';

const SEASON_PREFIX_DIGITS = 28;

/**
 * The digits every season identifier of one programme begins with, so a season can be traced back
 * to its programme from its identifier alone.
 *
 * @param showKey - What identifies the programme, as its library and the programme together.
 * @returns Twenty-eight hexadecimal digits.
 */
const seasonPrefixOf = (showKey: string): string =>
  syntheticJellyfinId('season', showKey).slice(0, SEASON_PREFIX_DIGITS);

export { SEASON_PREFIX_DIGITS, seasonPrefixOf };
