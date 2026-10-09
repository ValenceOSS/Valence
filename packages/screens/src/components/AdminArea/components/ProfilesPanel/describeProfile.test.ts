import { describe, expect, it } from 'vitest';
import { describeProfile } from './describeProfile';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const HD = aQualityProfile({ musicQualities: ['flac'] });

describe('describeProfile', () => {
  it('says what a video profile takes, and that it does not upgrade', () => {
    expect(describeProfile(HD)).toEqual({
      takes: 'Blu-ray 1080p, WEB-DL 1080p, Blu-ray 720p, WEB-DL 720p',
      upgrades: 'No',
    });
  });

  it('says what a music profile takes, and how far each upgrades', () => {
    expect(
      describeProfile({
        ...HD,
        kind: 'music',
        isUpgrading: true,
        upgradeUntilMusicQuality: 'flac',
      }),
    ).toEqual({ takes: 'FLAC', upgrades: 'Until FLAC' });
    expect(
      describeProfile({
        ...HD,
        isUpgrading: true,
        cutoff: 'bluray-1080p',
      }).upgrades,
    ).toBe('Until Blu-ray 1080p');
    expect(describeProfile({ ...HD, isUpgrading: true }).upgrades).toBe('To the best available');
  });
});
