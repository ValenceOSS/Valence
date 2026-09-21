import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import type {
  MusicQuality,
  ReleaseSource,
  Resolution,
} from '@ValenceContracts/schemas/ParsedRelease';
import type {
  ProfileKind,
  QualityProfile,
  QualityProfileDraft,
  QualitySize,
  ReleaseWait,
} from '@ValenceContracts/schemas/QualityProfile';

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

type ReadProfileForm =
  { draft: QualityProfileDraft; problem: null } | { draft: null; problem: string };

const DEFAULTS = QualityProfileDraftSchema.parse({ name: 'New', kind: 'video' });

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

/**
 * Reads words typed into the form, separated by commas.
 *
 * @param text - What was typed.
 * @returns The words.
 */
const wordsOf = (text: string): string[] =>
  text
    .split(',')
    .map((word) => word.trim())
    .filter((word) => word !== '');

/**
 * Reads a size typed into the form, where one was.
 *
 * @param text - What was typed.
 * @returns The size, null for none, or undefined where it is not a size.
 */
const sizeOf = (text: string): number | null | undefined => {
  if (text.trim() === '') {
    return null;
  }

  const size = Number(text.trim());

  return Number.isFinite(size) && size >= 0 ? size : undefined;
};

/**
 * Reads the profile form into a profile to keep, or says the first thing wrong with it in words
 * that point at the field. A video profile must allow at least one resolution, and a music profile
 * at least one format, or it would take nothing. Video is limited by the size of each quality, and
 * music by the size of an album.
 *
 * @param form - The form as it stands.
 * @returns The profile, or what is wrong.
 */
const readProfileForm = (form: ProfileForm): ReadProfileForm => {
  const name = form.name.trim();
  const smallestMb = sizeOf(form.smallestMb);
  const largestMb = sizeOf(form.largestMb);

  if (name === '') {
    return { draft: null, problem: 'Give the profile a name.' };
  }

  if (form.kind === 'video' && form.resolutions.length === 0) {
    return { draft: null, problem: 'Allow at least one resolution.' };
  }

  if (form.kind === 'music' && form.musicQualities.length === 0) {
    return { draft: null, problem: 'Allow at least one format.' };
  }

  const isMusic = form.kind === 'music';

  if (isMusic && (smallestMb === undefined || largestMb === undefined || largestMb === 0)) {
    return { draft: null, problem: 'A size is a number of megabytes.' };
  }

  if (
    isMusic &&
    smallestMb !== null &&
    smallestMb !== undefined &&
    largestMb !== null &&
    largestMb !== undefined &&
    largestMb <= smallestMb
  ) {
    return { draft: null, problem: 'The largest size has to be more than the smallest.' };
  }

  return {
    draft: {
      name,
      kind: form.kind,
      resolutions: form.resolutions,
      sources: form.sources,
      musicQualities: form.musicQualities,
      smallestMb: isMusic ? (smallestMb ?? null) : null,
      largestMb: isMusic ? (largestMb ?? null) : null,
      sizes: form.sizes,
      releaseWait: form.releaseWait,
      preferredWords: wordsOf(form.preferredWords),
      requiredWords: wordsOf(form.requiredWords),
      bannedWords: wordsOf(form.bannedWords),
      isUpgrading: form.isUpgrading,
      upgradeUntilResolution: form.isUpgrading ? form.upgradeUntilResolution : null,
      upgradeUntilSource: form.isUpgrading ? form.upgradeUntilSource : null,
      upgradeUntilMusicQuality: form.isUpgrading ? form.upgradeUntilMusicQuality : null,
      libraryIds: form.libraryIds,
      preferredLanguage: form.preferredLanguage,
      isDefault: form.isDefault,
      roleIds: form.isDefault ? [] : form.roleIds,
      accountIds: form.isDefault ? [] : form.accountIds,
    },
    problem: null,
  };
};

export type { ProfileForm };

export { A_NEW_PROFILE, formFor, readProfileForm };
