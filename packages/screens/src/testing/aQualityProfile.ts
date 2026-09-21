import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A profile for HD films that nobody in particular is named on, with anything a test cares about
 * changed.
 *
 * @param overrides - What to change.
 * @returns The profile, as the server shows it.
 */
const aQualityProfile = (overrides: Partial<QualityProfile> = {}): QualityProfile => ({
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'HD',
  kind: 'video',
  resolutions: ['1080p', '720p'],
  sources: ['bluray', 'webdl'],
  musicQualities: [],
  smallestMb: null,
  largestMb: null,
  sizes: [],
  preferredWords: [],
  requiredWords: [],
  bannedWords: [],
  isUpgrading: false,
  releaseWait: 'digital',
  upgradeUntilResolution: null,
  upgradeUntilSource: null,
  upgradeUntilMusicQuality: null,
  libraryIds: [],
  preferredLanguage: null,
  isDefault: false,
  roleIds: [],
  accountIds: [],
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aQualityProfile };
