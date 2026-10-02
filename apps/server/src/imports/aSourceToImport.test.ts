import { describe, expect, it } from 'vitest';
import { aSourceToImport } from './aSourceToImport';

describe('aSourceToImport', () => {
  it('reads like a small Jellyfin server, and takes what a test replaces', async () => {
    const reader = aSourceToImport({
      plays: () => Promise.resolve([{ key: 'k', itemId: 'heat', at: new Date(0) }]),
    });
    const [pat, sam] = await reader.users();
    const libraries = await reader.libraries();

    if (pat === undefined || sam === undefined) {
      throw new Error('no people');
    }

    expect(await reader.identify()).toMatchObject({ kind: 'jellyfin', name: 'Den' });
    expect(
      (await Promise.all(libraries.map((library) => reader.items(library)))).flat(),
    ).toHaveLength(7);
    expect(await reader.userStates(pat)).toHaveLength(5);
    expect(await reader.userStates(sam)).toHaveLength(1);
    expect(await reader.plays(pat)).toHaveLength(1);
    expect(await reader.favouriteArtists(sam)).toEqual([]);
    expect((await reader.playlists([sam])).size).toBe(0);
    expect((await reader.playlists([pat])).get('u-pat')).toHaveLength(1);
    expect(await reader.collections()).toHaveLength(1);
    expect(await reader.avatar(pat)).not.toBeNull();
    expect(await reader.avatar(sam)).toBeNull();
  });
});
