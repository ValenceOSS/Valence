import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { placeOfVideoQuality } from '@ValenceRequests/profiles/placeOfVideoQuality';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Whether what was fetched for a film or episode is short of what its profile would go on
 * upgrading to: a quality further down its list than the cutoff, or one the list cannot place. A
 * profile that does not upgrade never wants one, and where it names no cutoff it stops at its first
 * quality.
 *
 * @param profile - The profile.
 * @param releaseTitle - The name of what was fetched.
 * @returns Whether a better release should still be fetched.
 */
const wantsUpgrade = (profile: QualityProfile, releaseTitle: string): boolean => {
  if (!profile.isUpgrading || profile.kind !== 'video') {
    return false;
  }

  const place =
    placeOfVideoQuality(parseReleaseName(releaseTitle), profile.qualities) ??
    profile.qualities.length;
  const cutoff = profile.cutoff === null ? 0 : profile.qualities.indexOf(profile.cutoff);

  return place > Math.max(cutoff, 0);
};

export { wantsUpgrade };
