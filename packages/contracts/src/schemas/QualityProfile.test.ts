import { describe, expect, it } from 'vitest';
import { QualityProfileChangeSchema, QualityProfileDraftSchema } from './QualityProfile';

describe('QualityProfileDraftSchema', () => {
  it('fills in a sensible profile from a name and a kind', () => {
    expect(QualityProfileDraftSchema.parse({ name: ' HD ', kind: 'video' })).toEqual({
      name: 'HD',
      kind: 'video',
      resolutions: ['1080p', '720p'],
      sources: ['remux', 'bluray', 'webdl', 'webrip', 'hdtv'],
      musicQualities: ['flac', 'mp3-320', 'mp3-v0'],
      smallestMb: null,
      largestMb: null,
      preferredWords: [],
      requiredWords: [],
      bannedWords: [],
      isUpgrading: false,
      upgradeUntilResolution: null,
      upgradeUntilSource: null,
      upgradeUntilMusicQuality: null,
      libraryIds: [],
    });
  });

  it('refuses a resolution or source it does not know, and an empty word', () => {
    expect(() =>
      QualityProfileDraftSchema.parse({ name: 'x', kind: 'video', resolutions: ['8k'] }),
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
