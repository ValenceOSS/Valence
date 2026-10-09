import { describe, expect, it } from 'vitest';
import { askersKeptBelow } from './askersKeptBelow';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const UHD = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const HD = '3fa85f64-5717-4562-b3fc-2c963f66afa7';
const SD = '3fa85f64-5717-4562-b3fc-2c963f66afa8';

const aProfile = (id: string, name: string, position: number) =>
  ({ id, name, position, kind: 'video' }) satisfies Pick<
    QualityProfile,
    'id' | 'name' | 'position' | 'kind'
  >;

const PROFILES: QualityProfile[] = [
  aProfile(UHD, 'UHD 4K', 0),
  aProfile(HD, 'HD 1080p', 1),
  aProfile(SD, 'SD', 2),
].map((profile) => ({
  ...profile,
  qualities: [],
  musicQualities: [],
  smallestMb: null,
  largestMb: null,
  sizes: [],
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
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
}));

describe('askersKeptBelow', () => {
  it('finds who asked at a higher profile than the request was fetched with', () => {
    expect(
      askersKeptBelow(
        {
          profileId: HD,
          profileName: 'HD 1080p',
          alsoAskedBy: [
            { id: 'p', name: 'Priya', profileId: UHD, profileName: 'UHD 4K' },
            { id: 's', name: 'Sam', profileId: SD, profileName: 'SD' },
            { id: 'a', name: 'Ali' },
          ],
        },
        PROFILES,
      ).map((asker) => asker.name),
    ).toEqual(['Priya']);
  });

  it('finds nobody where the profile it was fetched with is not known', () => {
    expect(
      askersKeptBelow(
        {
          profileId: null,
          profileName: null,
          alsoAskedBy: [{ id: 'p', name: 'Priya', profileId: UHD }],
        },
        PROFILES,
      ),
    ).toEqual([]);
  });
});
