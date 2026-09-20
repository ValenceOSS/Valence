import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * How far down a profile's list something comes, where the list is best first — past the end where
 * it is not on the list, or not known.
 *
 * @param choices - The profile's choices, best first.
 * @param value - What a release is.
 * @returns Its place.
 */
const placeOf = <Choice extends string>(
  choices: readonly Choice[],
  value: Choice | null,
): number => {
  const place = value === null ? -1 : choices.indexOf(value);

  return place === -1 ? choices.length : place;
};

/**
 * Whether what was fetched for a film or episode is short of what its profile would go on
 * upgrading to: its resolution below the one to stop at, or the same resolution from a source
 * below the one to stop at. A profile that does not upgrade never wants one, and where it names no
 * point to stop at, it stops at its first choice.
 *
 * @param profile - The profile.
 * @param releaseTitle - The name of what was fetched.
 * @returns Whether a better release should still be fetched.
 */
const wantsUpgrade = (profile: QualityProfile, releaseTitle: string): boolean => {
  if (!profile.isUpgrading || profile.kind !== 'video') {
    return false;
  }

  const parsed = parseReleaseName(releaseTitle);
  const resolution = placeOf(profile.resolutions, parsed.resolution);
  const resolutionCutoff = placeOf(
    profile.resolutions,
    profile.upgradeUntilResolution ?? profile.resolutions[0] ?? null,
  );

  if (resolution !== resolutionCutoff) {
    return resolution > resolutionCutoff;
  }

  return (
    placeOf(profile.sources, parsed.source) >
    placeOf(profile.sources, profile.upgradeUntilSource ?? profile.sources[0] ?? null)
  );
};

export { wantsUpgrade };
