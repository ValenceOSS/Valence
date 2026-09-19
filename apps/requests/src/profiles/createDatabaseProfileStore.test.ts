import { describe, expect, it } from 'vitest';
import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import { aScratchDatabase } from '@ValenceRequests/testing/aScratchDatabase';
import { createDatabaseProfileStore } from './createDatabaseProfileStore';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const HD: QualityProfile = {
  ...QualityProfileDraftSchema.parse({
    name: 'HD',
    kind: 'video',
    largestMb: 8000,
    bannedWords: ['cam'],
    upgradeUntilResolution: '1080p',
    libraryIds: ['films'],
  }),
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('createDatabaseProfileStore', () => {
  it('keeps a profile, and reads it back as it was given', async () => {
    const store = createDatabaseProfileStore(await aScratchDatabase());

    expect(await store.insert(HD)).toEqual(HD);
    expect(await store.list()).toEqual([HD]);
    expect(await store.find(HD.id)).toEqual(HD);
    expect(await store.find('7c9e6679-7425-40de-944b-e07fc1f90ae7')).toBeNull();
  });

  it('changes only what it is told to, moments included', async () => {
    const store = createDatabaseProfileStore(await aScratchDatabase());

    await store.insert(HD);

    expect(
      await store.update(HD.id, {
        resolutions: ['2160p'],
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      }),
    ).toEqual({
      ...HD,
      resolutions: ['2160p'],
      createdAt: '2026-09-18T00:00:00.000Z',
      updatedAt: '2026-09-20T00:00:00.000Z',
    });
    expect(await store.update(HD.id, { name: 'UHD' })).toMatchObject({ name: 'UHD' });
    expect(await store.update('7c9e6679-7425-40de-944b-e07fc1f90ae7', { name: 'x' })).toBeNull();
  });

  it('forgets a profile, and says whether there was one', async () => {
    const store = createDatabaseProfileStore(await aScratchDatabase());

    await store.insert(HD);

    expect(await store.remove(HD.id)).toBe(true);
    expect(await store.remove(HD.id)).toBe(false);
  });
});
