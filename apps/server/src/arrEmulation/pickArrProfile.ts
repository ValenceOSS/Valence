import { arrIdOf } from '@ValenceServer/arrEmulation/arrIdOf';
import type { ArrProfile } from '@ValenceServer/arrEmulation/ArrEmulation';

/**
 * The quality profile Overseerr or Jellyseerr chose, by the number it was offered under.
 *
 * @param profiles - Valence's quality profiles.
 * @param number - The number sent back, if any.
 * @returns The profile's id, or nothing where the library's own is meant or none matched.
 */
const pickArrProfile = (
  profiles: readonly ArrProfile[],
  number: number | undefined,
): string | undefined =>
  number === undefined || number === 1
    ? undefined
    : profiles.find((profile) => arrIdOf(profile.id) === number)?.id;

export { pickArrProfile };
