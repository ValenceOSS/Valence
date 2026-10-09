import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Whether one quality profile is above another in the order the operator put them in, highest
 * first — which is what a higher-quality ask is measured by, not resolution.
 *
 * @param profile - The one asked about.
 * @param other - The one it is measured against.
 * @returns Whether it is higher.
 */
const isProfileAbove = (
  profile: Pick<QualityProfile, 'position'>,
  other: Pick<QualityProfile, 'position'>,
): boolean => profile.position < other.position;

export { isProfileAbove };
