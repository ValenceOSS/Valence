import { describe, expect, it } from 'vitest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { wantsUpgrade } from './wantsUpgrade';

const UPGRADING = aProfile({
  isUpgrading: true,
  qualities: ['bluray-2160p', 'webdl-2160p', 'bluray-1080p', 'webdl-1080p', 'bluray-720p'],
  cutoff: 'bluray-1080p',
});

describe('wantsUpgrade', () => {
  it('wants better until the quality it stops at', () => {
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.720p.BluRay.x264-GRP')).toBe(true);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.1080p.WEB-DL.x264-GRP')).toBe(true);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.1080p.BluRay.x264-GRP')).toBe(false);
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.2160p.WEB-DL.x265-GRP')).toBe(false);
  });

  it('wants better than something it cannot place', () => {
    expect(wantsUpgrade(UPGRADING, 'Dune.2021.x264-GRP')).toBe(true);
  });

  it('stops at its first quality where it names no cutoff', () => {
    const profile = { ...UPGRADING, cutoff: null };

    expect(wantsUpgrade(profile, 'Dune.2021.1080p.BluRay.x264-GRP')).toBe(true);
    expect(wantsUpgrade(profile, 'Dune.2021.2160p.BluRay.x265-GRP')).toBe(false);
  });

  it('never wants one from a profile that does not upgrade', () => {
    expect(wantsUpgrade(aProfile(), 'Dune.2021.480p.DVD.x264-GRP')).toBe(false);
  });
});
