import { describe, expect, it } from 'vitest';
import {
  RECOMMENDED_QUALITY_SIZES,
  VIDEO_QUALITIES,
  QualityProfileChangeSchema,
  QualityProfileDraftSchema,
} from './QualityProfile';

describe('QualityProfileDraftSchema', () => {
  it('fills in a sensible profile from a name and a kind', () => {
    expect(QualityProfileDraftSchema.parse({ name: ' HD ', kind: 'video' })).toEqual({
      name: 'HD',
      kind: 'video',
      qualities: [
        'remux-1080p',
        'bluray-1080p',
        'webdl-1080p',
        'webrip-1080p',
        'hdtv-1080p',
        'bluray-720p',
        'webdl-720p',
        'webrip-720p',
        'hdtv-720p',
      ],
      musicQualities: ['flac', 'mp3-320', 'mp3-v0'],
      smallestMb: null,
      largestMb: null,
      sizes: [...RECOMMENDED_QUALITY_SIZES],
      preferredWords: [],
      requiredWords: [],
      bannedWords: [],
      formats: [],
      minFormatScore: 0,
      upgradeUntilFormatScore: null,
      isUpgrading: false,
      releaseWait: 'digital',
      cutoff: null,
      upgradeUntilMusicQuality: null,
      libraryIds: [],
      preferredLanguage: null,
      isDefault: false,
      roleIds: [],
      accountIds: [],
    });
  });

  it('leaves a new profile nobody’s in particular, and the choice of quality open', () => {
    const draft = QualityProfileDraftSchema.parse({ name: 'HD', kind: 'video' });

    expect(draft).toMatchObject({
      isDefault: false,
      roleIds: [],
      accountIds: [],
      preferredLanguage: null,
    });
  });

  it('refuses a resolution or source it does not know, and an empty word', () => {
    expect(() =>
      QualityProfileDraftSchema.parse({ name: 'x', kind: 'video', qualities: ['webdl-8k'] }),
    ).toThrow();
    expect(() =>
      QualityProfileDraftSchema.parse({ name: 'x', kind: 'video', bannedWords: [' '] }),
    ).toThrow();
  });
});

describe('QualityProfileChangeSchema', () => {
  it('takes a change to one thing, filling in nothing else', () => {
    expect(QualityProfileChangeSchema.parse({ isUpgrading: true })).toEqual({ isUpgrading: true });
  });
});

describe('RECOMMENDED_QUALITY_SIZES', () => {
  it('names only qualities a video profile can hold', () => {
    for (const size of RECOMMENDED_QUALITY_SIZES) {
      expect(
        VIDEO_QUALITIES.some(
          (quality) => quality.source === size.source && quality.resolution === size.resolution,
        ),
      ).toBe(true);
    }
  });
});
