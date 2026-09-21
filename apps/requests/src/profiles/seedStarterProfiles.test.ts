import { describe, expect, it, vi } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { createProfileService } from '@ValenceRequests/profiles/createProfileService';
import { seedStarterProfiles } from '@ValenceRequests/profiles/seedStarterProfiles';
import type { QualityProfile } from '@ValenceContracts/schemas/QualityProfile';

const aSeeding = (seededBefore: string[] = []) => {
  const profiles = createProfileService({ store: createMemoryRecordStore<QualityProfile>() });
  let names = [...seededBefore];

  return {
    profiles,
    names: () => names,
    seed: () =>
      seedStarterProfiles({
        profiles,
        seeded: () => Promise.resolve(names),
        remember: (next) => {
          names = [...next];

          return Promise.resolve();
        },
      }),
  };
};

describe('seedStarterProfiles', () => {
  it('gives a fresh server the profiles every server wants, for video and for music', async () => {
    const { profiles, seed } = aSeeding();

    expect(await seed()).toEqual([
      '4K',
      '1080p',
      '1080p or 720p',
      '720p',
      'Any',
      'Lossless',
      'MP3 320',
      'Any music',
    ]);

    const kinds = (await profiles.list()).map((profile) => profile.kind);

    expect(kinds.filter((kind) => kind === 'video')).toHaveLength(5);
    expect(kinds.filter((kind) => kind === 'music')).toHaveLength(3);
  });

  it('gives each of them what its name promises', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    const byName = new Map((await profiles.list()).map((profile) => [profile.name, profile]));

    expect(byName.get('4K')?.resolutions).toEqual(['2160p']);
    expect(byName.get('1080p or 720p')?.resolutions).toEqual(['1080p', '720p']);
    expect(byName.get('Lossless')?.musicQualities).toEqual(['flac24', 'flac', 'alac']);
    expect(byName.get('MP3 320')?.musicQualities).toEqual(['mp3-320', 'mp3-v0', 'aac']);
    expect(byName.get('Any music')?.musicQualities).toHaveLength(10);
  });

  it('leaves every one of them for the house to ask with, and none of them forced', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    for (const profile of await profiles.list()) {
      expect(profile).toMatchObject({
        isDefault: false,
        roleIds: [],
        accountIds: [],
        libraryIds: [],
      });
    }
  });

  it('does nothing a second time', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    expect(await seed()).toEqual([]);
    expect(await profiles.list()).toHaveLength(8);
  });

  it('seeds only what a server has not seen, so a later version can add one', async () => {
    const { profiles, seed } = aSeeding(['4K', '1080p', '1080p or 720p', '720p', 'Any']);

    expect(await seed()).toEqual(['Lossless', 'MP3 320', 'Any music']);
    expect((await profiles.list()).map((profile) => profile.kind)).toEqual([
      'music',
      'music',
      'music',
    ]);
  });

  it('keeps a profile an operator deleted deleted', async () => {
    const { profiles, seed } = aSeeding();

    await seed();

    for (const profile of await profiles.list()) {
      await profiles.remove(profile.id);
    }

    expect(await seed()).toEqual([]);
    expect(await profiles.list()).toEqual([]);
  });

  it('leaves alone a profile whose name an operator has already taken, and stops offering it', async () => {
    const { profiles, seed, names } = aSeeding();
    const mine = await profiles.add({ name: '4K', kind: 'video', resolutions: ['1080p'] });

    expect(await seed()).not.toContain('4K');
    expect((await profiles.find(mine.id))?.resolutions).toEqual(['1080p']);
    expect(names()).toContain('4K');
  });

  it('records every name it has seen, so a restart does not do it again', async () => {
    const remember = vi.fn((names: readonly string[]) => {
      void names;

      return Promise.resolve();
    });
    const profiles = createProfileService({ store: createMemoryRecordStore<QualityProfile>() });

    await seedStarterProfiles({ profiles, seeded: () => Promise.resolve([]), remember });

    expect(remember).toHaveBeenCalledOnce();
    expect(remember).toHaveBeenCalledWith(expect.arrayContaining(['4K', 'Lossless']));
  });
});
