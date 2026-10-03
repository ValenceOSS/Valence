import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import type {
  ProfileKind,
  QualityProfile,
  QualitySize,
  ReleaseWait,
} from '@ValenceContracts/schemas/QualityProfile';
import { say } from '@ValenceI18n/say';

type ProfileForm = {
  name: string;
  kind: ProfileKind;
  resolutions: Resolution[];
  sources: ReleaseSource[];
  musicQualities: MusicQuality[];
  smallestMb: string;
  largestMb: string;
  sizes: QualitySize[];
  releaseWait: ReleaseWait;
  preferredWords: string;
  requiredWords: string;
  bannedWords: string;
  isUpgrading: boolean;
  upgradeUntilResolution: Resolution | null;
  upgradeUntilSource: ReleaseSource | null;
  upgradeUntilMusicQuality: MusicQuality | null;
  libraryIds: string[];
  preferredLanguage: string | null;
  isDefault: boolean;
  roleIds: string[];
  accountIds: string[];
};

type ProfileTab = 'quality' | 'matching' | 'access';

const DEFAULTS = QualityProfileDraftSchema.parse({
  name: say('screens.profileEditor.readProfileForm.new'),
  kind: 'video',
});

const A_NEW_PROFILE: ProfileForm = {
  name: '',
  kind: 'video',
  resolutions: DEFAULTS.resolutions,
  sources: DEFAULTS.sources,
  musicQualities: DEFAULTS.musicQualities,
  smallestMb: '',
  largestMb: '',
  sizes: DEFAULTS.sizes,
  releaseWait: DEFAULTS.releaseWait,
  preferredWords: '',
  requiredWords: '',
  bannedWords: '',
  isUpgrading: false,
  upgradeUntilResolution: null,
  upgradeUntilSource: null,
  upgradeUntilMusicQuality: null,
  libraryIds: [],
  preferredLanguage: null,
  isDefault: false,
  roleIds: [],
  accountIds: [],
};

/**
 * The form as it opens: a sensible start for a new profile, or one already kept.
 *
 * @param profile - The profile being changed, where it is one.
 * @returns The form.
 */
const formFor = (profile: QualityProfile | null): ProfileForm =>
  profile === null
    ? A_NEW_PROFILE
    : {
        name: profile.name,
        kind: profile.kind,
        resolutions: profile.resolutions,
        sources: profile.sources,
        musicQualities: profile.musicQualities,
        smallestMb: profile.smallestMb?.toString() ?? '',
        largestMb: profile.largestMb?.toString() ?? '',
        sizes: profile.sizes,
        releaseWait: profile.releaseWait,
        preferredWords: profile.preferredWords.join(', '),
        requiredWords: profile.requiredWords.join(', '),
        bannedWords: profile.bannedWords.join(', '),
        isUpgrading: profile.isUpgrading,
        upgradeUntilResolution: profile.upgradeUntilResolution,
        upgradeUntilSource: profile.upgradeUntilSource,
        upgradeUntilMusicQuality: profile.upgradeUntilMusicQuality,
        libraryIds: profile.libraryIds,
        preferredLanguage: profile.preferredLanguage,
        isDefault: profile.isDefault,
        roleIds: profile.roleIds,
        accountIds: profile.accountIds,
      };

export type { ProfileForm, ProfileTab };

export { A_NEW_PROFILE, formFor };
