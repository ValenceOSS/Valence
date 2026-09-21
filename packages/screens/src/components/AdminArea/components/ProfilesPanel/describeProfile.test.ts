import { describe, expect, it } from 'vitest';
import { describeProfile } from './describeProfile';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const HD = aQualityProfile({ musicQualities: ['flac'] });

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
