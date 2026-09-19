import { describe, expect, it } from 'vitest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { wantsUpgrade } from './wantsUpgrade';

const UPGRADING = aProfile({
  isUpgrading: true,
  resolutions: ['2160p', '1080p', '720p'],
  sources: ['bluray', 'webdl', 'hdtv'],
  upgradeUntilResolution: '1080p',
  upgradeUntilSource: 'bluray',
});

describe('wantsUpgrade', () => {
  it('wants better until the resolution and source it stops at', () => {
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.720p.BluRay.x264-GRP')).toBe(true);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.1080p.WEB-DL.x264-GRP')).toBe(true);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.1080p.BluRay.x264-GRP')).toBe(false);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.2160p.WEB-DL.x265-GRP')).toBe(false);
  });

  it('wants better than something it cannot place', () => {
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.x264-GRP')).toBe(true);
  });

  it('stops at its first choices where it names nothing to stop at', () => {
    const profile = { ...UPGRADING, upgradeUntilResolution: null, upgradeUntilSource: null };

    expect(wantsUpgrade(profile, 'Dune.2021.1080p.BluRay.x264-GRP')).toBe(true);
    expect(wantsUpgrade(profile, 'Dune.2021.2160p.BluRay.x265-GRP')).toBe(false);
  });

  it('never wants one from a profile that does not upgrade', () => {
    expect(wantsUpgrade(aProfile(), 'Dune.2021.480p.DVD.x264-GRP')).toBe(false);
  });
});
