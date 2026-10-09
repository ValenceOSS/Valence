import {
  DEFAULT_VIDEO_QUALITIES,
  RECOMMENDED_QUALITY_SIZES,
} from '@ValenceContracts/schemas/QualityProfile';
import { describe, expect, it } from 'vitest';
import { A_NEW_PROFILE } from './readProfileForm';
import type { ProfileForm } from './readProfileForm';
import { profileFormSchema } from './profileFormSchema';

const FILLED = { ...A_NEW_PROFILE, name: ' HD ' };

const read = (form: ProfileForm) => {
  const parsed = profileFormSchema.safeParse(form);

  return parsed.success
    ? { draft: parsed.data, problem: null }
    : { draft: null, problem: parsed.error.issues[0]?.message ?? null };
};

describe('profileFormSchema', () => {
  it('reads a profile, words split by commas, its sizes by quality', () => {
    expect(
      read({
        ...FILLED,
        smallestMb: ' 500 ',
        largestMb: '8000',
        releaseWait: 'physical',
        preferredWords: 'HDR, Atmos, , /\\bdv\\b/',
        isUpgrading: true,
        cutoff: 'bluray-1080p',
      }),
    ).toEqual({
      draft: {
        name: 'HD',
        kind: 'video',
        qualities: [...DEFAULT_VIDEO_QUALITIES],
        musicQualities: ['flac', 'mp3-320', 'mp3-v0'],
        smallestMb: null,
        largestMb: null,
        sizes: [...RECOMMENDED_QUALITY_SIZES],
        releaseWait: 'physical',
        preferredWords: ['HDR', 'Atmos', '/\\bdv\\b/'],
        requiredWords: [],
        bannedWords: [],
        formats: [],
        minFormatScore: 0,
        upgradeUntilFormatScore: null,
        isUpgrading: true,
        cutoff: 'bluray-1080p',
        upgradeUntilMusicQuality: null,
        libraryIds: [],
        preferredLanguage: null,
        isDefault: false,
        roleIds: [],
        accountIds: [],
      },
      problem: null,
    });
  });

  it('forgets who is named once the profile is what everything goes through', () => {
    expect(
      read({
        ...FILLED,
        isDefault: true,
        roleIds: ['trusted'],
        accountIds: ['dan'],
      }).draft,
    ).toMatchObject({ isDefault: true, roleIds: [], accountIds: [] });
  });

  it('keeps who is named while the profile is one among others', () => {
    expect(read({ ...FILLED, roleIds: ['trusted'], accountIds: ['dan'] }).draft).toMatchObject({
      isDefault: false,
      roleIds: ['trusted'],
      accountIds: ['dan'],
    });
  });

  it('forgets how far to upgrade when upgrading is off', () => {
    expect(read({ ...FILLED, isUpgrading: false, cutoff: 'bluray-1080p' }).draft).toMatchObject({
      cutoff: null,
    });
  });

  it('reads custom formats, their scores and the score to upgrade until', () => {
    expect(
      read({
        ...FILLED,
        isUpgrading: true,
        minFormatScore: '-100',
        upgradeUntilFormatScore: '500',
        formats: [
          {
            name: ' HDR ',
            score: '500',
            conditions: [{ kind: 'hdr', value: 'hdr10', isNegated: false, isRequired: false }],
          },
        ],
      }).draft,
    ).toMatchObject({
      minFormatScore: -100,
      upgradeUntilFormatScore: 500,
      formats: [{ name: 'HDR', score: 500 }],
    });
  });

  it.each<[Partial<ProfileForm>, string]>([
    [{ name: ' ' }, 'Enter a name for the profile.'],
    [{ formats: [{ name: ' ', score: '1', conditions: [] }] }, 'Name every custom format.'],
    [
      {
        formats: [
          {
            name: 'HDR',
            score: '1',
            conditions: [{ kind: 'words', value: ' ', isNegated: false, isRequired: false }],
          },
        ],
      },
      'Give every condition a value.',
    ],
    [{ minFormatScore: '1.5' }, 'Scores are whole numbers, such as 100 or -500.'],
    [{ qualities: [] }, 'Allow at least one quality.'],
    [{ kind: 'music', musicQualities: [] }, 'Allow at least one format.'],
    [{ kind: 'music', smallestMb: 'lots' }, 'Enter sizes in megabytes.'],
    [{ kind: 'music', largestMb: '0' }, 'Enter sizes in megabytes.'],
    [
      { kind: 'music', smallestMb: '900', largestMb: '800' },
      'The largest size must be more than the smallest.',
    ],
  ])('says what is wrong with %o', (change, problem) => {
    expect(read({ ...FILLED, ...change })).toEqual({
      draft: null,
      problem,
    });
  });
});
