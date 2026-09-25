import { say } from '@ValenceI18n/say';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * Says in a line what a profile takes, best first, and how far it upgrades.
 *
 * @param profile - The profile.
 * @returns What it takes, and its upgrade rule.
 */
const describeProfile = (profile: QualityProfile): { takes: string; upgrades: string } => {
  const named = (values: readonly (keyof typeof QUALITY_NAMES)[]) =>
    values.map((value) => QUALITY_NAMES[value]).join(', ');
  const until = [
    profile.upgradeUntilResolution,
    profile.upgradeUntilSource,
    profile.upgradeUntilMusicQuality,
  ]
    .filter((value) => value !== null)
    .map((value) => QUALITY_NAMES[value])
    .join(' ');

  return {
    takes:
      profile.kind === 'video'
        ? [named(profile.resolutions), named(profile.sources)].filter(Boolean).join(' · ')
        : named(profile.musicQualities),
    upgrades: !profile.isUpgrading
      ? say('admin.describeProfile.noUpgrades')
      : until === ''
        ? say('admin.describeProfile.toTheBest')
        : say('admin.describeProfile.until', { quality: until }),
  };
};

export { describeProfile };
