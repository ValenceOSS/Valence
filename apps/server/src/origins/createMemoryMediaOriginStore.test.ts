import { describe, expect, it } from 'vitest';
import { createMemoryMediaOriginStore } from '@ValenceServer/origins/createMemoryMediaOriginStore';

describe('createMemoryMediaOriginStore', () => {
  it('keeps the latest origin recorded, and leaves a known one where told to', async () => {
    const store = createMemoryMediaOriginStore();

    await store.record([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'import', via: 'Plex' },
    ]);
    await store.record([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'upload', via: null },
    ]);
    await store.recordUnlessKnown([
      { libraryId: 'films', path: '/films/Up.mkv', source: 'import', via: 'Jellyfin' },
      { libraryId: 'films', path: '/films/Heat.mkv', source: 'import', via: 'Jellyfin' },
    ]);

    expect(await store.read(['/films/Up.mkv', '/films/Heat.mkv', '/films/Alien.mkv'])).toEqual({
      '/films/Up.mkv': { source: 'upload', via: null },
      '/films/Heat.mkv': { source: 'import', via: 'Jellyfin' },
    });
  });
});
