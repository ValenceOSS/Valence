import { describe, expect, it, vi } from 'vitest';
import { heldAlbumsOf } from './heldAlbumsOf';
import type { MusicQuality } from '@ValenceContracts/schemas/ParsedRelease';

describe('heldAlbumsOf', () => {
  it('tells a request each album held, at the quality its tracks are', async () => {
    const albumQualities = vi.fn(() =>
      Promise.resolve(new Map<string, MusicQuality>([['a', 'flac']])),
    );

    expect(await heldAlbumsOf({ albumQualities }, [{ id: 'a' }, { id: 'b' }])).toEqual({
      mediaId: null,
      episodes: [],
      folder: null,
      seasonFolders: [],
      albums: [{ id: 'a', quality: 'flac' }],
    });
    expect(albumQualities).toHaveBeenCalledWith(['a', 'b']);
  });
});
