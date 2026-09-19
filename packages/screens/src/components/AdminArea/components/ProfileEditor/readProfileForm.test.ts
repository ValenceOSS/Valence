import { RECOMMENDED_QUALITY_SIZES } from '@ValenceContracts/schemas/QualityProfile';
import { describe, expect, it } from 'vitest';
import { A_NEW_PROFILE, formFor, readProfileForm } from './readProfileForm';
import type { ProfileForm } from './readProfileForm';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const KEPT: QualityProfile = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'Albums',
  kind: 'music',
  resolutions: [],
  sources: [],
  musicQualities: ['flac', 'mp3-320'],
  smallestMb: 50,
  largestMb: null,
  preferredWords: ['Deluxe', 'Remastered'],
  requiredWords: [],
  bannedWords: ['karaoke'],
  isUpgrading: true,
  releaseWait: 'digital',
  sizes: [],
  upgradeUntilResolution: null,
  upgradeUntilSource: null,
  upgradeUntilMusicQuality: 'flac',
  libraryIds: ['music'],
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const FILLED = { ...A_NEW_PROFILE, name: ' HD ' };

describe('formFor', () => {
  it('opens a new profile on sensible choices', () => {
    expect(formFor(null)).toEqual(A_NEW_PROFILE);
    expect(A_NEW_PROFILE.resolutions).toEqual(['1080p', '720p']);
  });

  it('opens on a kept profile, its words and sizes written out', () => {
    expect(formFor(KEPT)).toMatchObject({
      name: 'Albums',
      kind: 'music',
      smallestMb: '50',
      largestMb: '',
      preferredWords: 'Deluxe, Remastered',
      bannedWords: 'karaoke',
      upgradeUntilMusicQuality: 'flac',
    });
  });
});

describe('readProfileForm', () => {
  it('reads a profile, words split by commas, its sizes by quality', () => {
    expect(
      readProfileForm({
        ...FILLED,
        smallestMb: ' 500 ',
        largestMb: '8000',
        releaseWait: 'physical',
        preferredWords: 'HDR, Atmos, , /\\bdv\\b/',
        isUpgrading: true,
        upgradeUntilResolution: '1080p',
        upgradeUntilSource: 'bluray',
      }),
    ).toEqual({
      draft: {
        name: 'HD',
        kind: 'video',
        resolutions: ['1080p', '720p'],
        sources: ['remux', 'bluray', 'webdl', 'webrip', 'hdtv'],
        musicQualities: ['flac', 'mp3-320', 'mp3-v0'],
        smallestMb: null,
        largestMb: null,
        sizes: [...RECOMMENDED_QUALITY_SIZES],
        releaseWait: 'physical',
        preferredWords: ['HDR', 'Atmos', '/\\bdv\\b/'],
        requiredWords: [],
        bannedWords: [],
        isUpgrading: true,
        upgradeUntilResolution: '1080p',
        upgradeUntilSource: 'bluray',
        upgradeUntilMusicQuality: null,
        libraryIds: [],
      },
      problem: null,
    });
  });

  it('forgets how far to upgrade when upgrading is off', () => {
    expect(
      readProfileForm({ ...FILLED, isUpgrading: false, upgradeUntilResolution: '2160p' }).draft,
    ).toMatchObject({ upgradeUntilResolution: null });
  });

  it.each<[Partial<ProfileForm>, string]>([
    [{ name: ' ' }, 'Give the profile a name.'],
    [{ resolutions: [] }, 'Allow at least one resolution.'],
    [{ kind: 'music', musicQualities: [] }, 'Allow at least one format.'],
    [{ kind: 'music', smallestMb: 'lots' }, 'A size is a number of megabytes.'],
    [{ kind: 'music', largestMb: '0' }, 'A size is a number of megabytes.'],
    [
      { kind: 'music', smallestMb: '900', largestMb: '800' },
      'The largest size has to be more than the smallest.',
    ],
  ])('says what is wrong with %o', (change, problem) => {
    expect(readProfileForm({ ...FILLED, ...change })).toEqual({ draft: null, problem });
  });
});
