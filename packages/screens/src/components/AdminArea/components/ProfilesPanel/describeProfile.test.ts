import { describe, expect, it } from 'vitest';
import { describeProfile } from './describeProfile';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const HD: QualityProfile = {
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'HD',
  kind: 'video',
  resolutions: ['1080p', '720p'],
  sources: ['bluray', 'webdl'],
  musicQualities: ['flac'],
  smallestMb: null,
  largestMb: null,
  preferredWords: [],
  requiredWords: [],
  bannedWords: [],
  isUpgrading: false,
  releaseWait: 'digital',
  sizes: [],
  upgradeUntilResolution: null,
  upgradeUntilSource: null,
  upgradeUntilMusicQuality: null,
  libraryIds: [],
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('describeProfile', () => {
  it('says what a video profile takes, and that it does not upgrade', () => {
    expect(describeProfile(HD)).toEqual({
      takes: '1080p, 720p · Blu-ray, WEB-DL',
      upgrades: 'Does not upgrade',
    });
    expect(describeProfile({ ...HD, sources: [] }).takes).toBe('1080p, 720p');
  });

  it('says what a music profile takes, and how far each upgrades', () => {
    expect(
      describeProfile({
        ...HD,
        kind: 'music',
        isUpgrading: true,
        upgradeUntilMusicQuality: 'flac',
      }),
    ).toEqual({ takes: 'FLAC', upgrades: 'Upgrades until FLAC' });
    expect(
      describeProfile({
        ...HD,
        isUpgrading: true,
        upgradeUntilResolution: '1080p',
        upgradeUntilSource: 'bluray',
      }).upgrades,
    ).toBe('Upgrades until 1080p Blu-ray');
    expect(describeProfile({ ...HD, isUpgrading: true }).upgrades).toBe(
      'Upgrades to the best there is',
    );
  });
});
