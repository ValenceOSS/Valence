import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { createProfileService } from '@ValenceRequests/profiles/createProfileService';
import { seedStarterProfiles } from '@ValenceRequests/profiles/seedStarterProfiles';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const aSeeding = (wasSeededBefore = false) => {
  const profiles = createProfileService({ store: createMemoryRecordStore<QualityProfile>() });
  let seeded = wasSeededBefore;

  return {
    profiles,
    seed: () =>
      seedStarterProfiles({
        profiles,
        wasSeeded: () => Promise.resolve(seeded),
        remember: () => {
          seeded = true;

          return Promise.resolve();
        },
      }),
  };
};

describe('seedStarterProfiles', () => {
  it('gives a fresh server the five profiles every server wants', async () => {
    const { profiles, seed } = aSeeding();

    expect(await seed()).toEqual(['4K', '1080p', '1080p or 720p', '720p', 'Any']);
    expect((await profiles.list()).map((profile) => profile.name)).toEqual([
      '1080p',
      '1080p or 720p',
      '4K',
      '720p',
      'Any',
    ]);
  });

  it('gives each of them the resolutions its name promises', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    const byName = new Map((await profiles.list()).map((profile) => [profile.name, profile]));

    expect(byName.get('4K')?.resolutions).toEqual(['2160p']);
    expect(byName.get('1080p or 720p')?.resolutions).toEqual(['1080p', '720p']);
    expect(byName.get('Any')?.resolutions).toEqual(['2160p', '1080p', '720p', '576p', '480p']);
  });

  it('leaves every one of them for the house to ask with, and none of them forced', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    for (const profile of await profiles.list()) {
      expect(profile).toMatchObject({ isDefault: false, roleIds: [], accountIds: [] });
    }
  });

  it('does nothing on a server that has been seeded before', async () => {
    const { profiles, seed } = aSeeding(true);

    expect(await seed()).toEqual([]);
    expect(await profiles.list()).toEqual([]);
  });

  it('does it once, so profiles an operator deleted stay deleted', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    for (const profile of await profiles.list()) {
      await profiles.remove(profile.id);
    }

    expect(await seed()).toEqual([]);
    expect(await profiles.list()).toEqual([]);
  });

  it('leaves alone a profile whose name an operator has already taken', async () => {
    const { profiles, seed } = aSeeding();
    const mine = await profiles.add({ name: '4K', kind: 'video', resolutions: ['1080p'] });

    expect(await seed()).not.toContain('4K');
    expect((await profiles.find(mine.id))?.resolutions).toEqual(['1080p']);
    expect((await profiles.list()).filter((profile) => profile.name === '4K')).toHaveLength(1);
  });

  it('records that it has been done, so a restart does not do it again', async () => {
    const remember = vi.fn(() => Promise.resolve());
    const profiles = createProfileService({ store: createMemoryRecordStore<QualityProfile>() });

    await seedStarterProfiles({ profiles, wasSeeded: () => Promise.resolve(false), remember });

    expect(remember).toHaveBeenCalledOnce();
  });
});
