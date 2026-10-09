import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';
import type {
  ProfileKind,
  QualityProfile,
  QualitySize,
  ReleaseWait,
  VideoQualityId,
} from '@ValenceContracts/schemas/QualityProfile';
import type { FormatDraft } from './components/CustomFormats/CustomFormats.types';
import { say } from '@ValenceI18n/say';

type ProfileForm = {
  name: string;
  kind: ProfileKind;
  qualities: VideoQualityId[];
  musicQualities: MusicQuality[];
  smallestMb: string;
  largestMb: string;
  sizes: QualitySize[];
  releaseWait: ReleaseWait;
  preferredWords: string;
  requiredWords: string;
  bannedWords: string;
  formats: FormatDraft[];
  minFormatScore: string;
  upgradeUntilFormatScore: string;
  isUpgrading: boolean;
  cutoff: VideoQualityId | null;
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
  qualities: DEFAULTS.qualities,
  musicQualities: DEFAULTS.musicQualities,
  smallestMb: '',
  largestMb: '',
  sizes: DEFAULTS.sizes,
  releaseWait: DEFAULTS.releaseWait,
  preferredWords: '',
  requiredWords: '',
  bannedWords: '',
  formats: [],
  minFormatScore: '0',
  upgradeUntilFormatScore: '',
  isUpgrading: false,
  cutoff: null,
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
        qualities: profile.qualities,
        musicQualities: profile.musicQualities,
        smallestMb: profile.smallestMb?.toString() ?? '',
        largestMb: profile.largestMb?.toString() ?? '',
        sizes: profile.sizes,
        releaseWait: profile.releaseWait,
        preferredWords: profile.preferredWords.join(', '),
        requiredWords: profile.requiredWords.join(', '),
        bannedWords: profile.bannedWords.join(', '),
        formats: profile.formats.map((format) => ({ ...format, score: format.score.toString() })),
        minFormatScore: profile.minFormatScore.toString(),
        upgradeUntilFormatScore: profile.upgradeUntilFormatScore?.toString() ?? '',
        isUpgrading: profile.isUpgrading,
        cutoff: profile.cutoff,
        upgradeUntilMusicQuality: profile.upgradeUntilMusicQuality,
        libraryIds: profile.libraryIds,
        preferredLanguage: profile.preferredLanguage,
        isDefault: profile.isDefault,
        roleIds: profile.roleIds,
        accountIds: profile.accountIds,
      };

export type { ProfileForm, ProfileTab };

export { A_NEW_PROFILE, formFor };
