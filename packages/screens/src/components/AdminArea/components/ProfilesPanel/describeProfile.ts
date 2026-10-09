import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import { nameVideoQuality } from '@ValenceScreens/components/AdminArea/nameVideoQuality';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { say } from '@ValenceI18n/say';

/**
 * Says in a line what a profile takes, best first, and how far it upgrades.
 *
 * @param profile - The profile.
 * @returns What it takes, and its upgrade rule.
 */
const describeProfile = (profile: QualityProfile): { takes: string; upgrades: string } => {
  const isVideo = profile.kind === 'video';
  const until = isVideo
    ? profile.cutoff === null
      ? ''
      : nameVideoQuality(profile.cutoff)
    : profile.upgradeUntilMusicQuality === null
      ? ''
      : QUALITY_NAMES[profile.upgradeUntilMusicQuality];

  return {
    takes: isVideo
      ? profile.qualities.map(nameVideoQuality).join(', ')
      : profile.musicQualities.map((quality) => QUALITY_NAMES[quality]).join(', '),
    upgrades: !profile.isUpgrading
      ? say('screens.profilesPanel.describeProfile.no')
      : until === ''
        ? say('screens.profilesPanel.describeProfile.toTheBestThereIs')
        : say('screens.profilesPanel.describeProfile.untilUntil', { until }),
  };
};

export { describeProfile };
