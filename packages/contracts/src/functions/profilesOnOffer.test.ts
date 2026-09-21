import { describe, expect, it } from 'vitest';
import { profilesOnOffer } from '@ValenceContracts/functions/profilesOnOffer';
import type { ProfileKind, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const aProfile = (
  id: string,
  kind: ProfileKind,
  extra: Partial<QualityProfile> = {},
): QualityProfile => ({
  id,
  name: id,
  kind,
  resolutions: [],
  sources: [],
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
  isDefault: false,
  roleIds: [],
  accountIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...extra,
});

const anybody = { accountId: 'someone', roleIds: [] };

describe('profilesOnOffer', () => {
  it('offers every profile that names nobody', () => {
    const offered = profilesOnOffer(
      [aProfile('1080p', 'video'), aProfile('720p', 'video')],
      'video',
      anybody,
    );

    expect(offered.choices.map((profile) => profile.id)).toEqual(['1080p', '720p']);
    expect(offered.forcedId).toBeNull();
  });

  it('leaves out a profile whose roles the asker does not hold', () => {
    const offered = profilesOnOffer(
      [aProfile('1080p', 'video'), aProfile('2160p', 'video', { roleIds: ['trusted'] })],
      'video',
      anybody,
    );

    expect(offered.choices.map((profile) => profile.id)).toEqual(['1080p']);
  });

  it('offers a gated profile to somebody holding one of its roles', () => {
    const offered = profilesOnOffer(
      [aProfile('2160p', 'video', { roleIds: ['trusted', 'household'] })],
      'video',
      { accountId: 'someone', roleIds: ['household'] },
    );

    expect(offered.choices.map((profile) => profile.id)).toEqual(['2160p']);
  });

  it('offers a gated profile to an account named on it directly', () => {
    const offered = profilesOnOffer(
      [aProfile('2160p', 'video', { accountIds: ['dan'] })],
      'video',
      { accountId: 'dan', roleIds: [] },
    );

    expect(offered.choices.map((profile) => profile.id)).toEqual(['2160p']);
  });

  it('offers only the default, to everybody, once one is set', () => {
    const offered = profilesOnOffer(
      [
        aProfile('1080p', 'video'),
        aProfile('720p', 'video', { isDefault: true }),
        aProfile('2160p', 'video', { accountIds: ['dan'] }),
      ],
      'video',
      { accountId: 'dan', roleIds: ['trusted'] },
    );

    expect(offered.choices.map((profile) => profile.id)).toEqual(['720p']);
    expect(offered.forcedId).toBe('720p');
  });

  it('keeps the kinds apart', () => {
    const profiles = [
      aProfile('flac', 'music'),
      aProfile('mp3', 'music'),
      aProfile('1080p', 'video', { isDefault: true }),
    ];

    expect(profilesOnOffer(profiles, 'music', anybody).forcedId).toBeNull();
    expect(profilesOnOffer(profiles, 'music', anybody).choices).toHaveLength(2);
    expect(profilesOnOffer(profiles, 'video', anybody).forcedId).toBe('1080p');
  });

  it('offers nothing where every profile is gated away', () => {
    const offered = profilesOnOffer(
      [aProfile('2160p', 'video', { roleIds: ['trusted'] })],
      'video',
      anybody,
    );

    expect(offered.choices).toEqual([]);
    expect(offered.forcedId).toBeNull();
  });
});
