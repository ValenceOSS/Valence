import { describe, expect, it, vi } from 'vitest';
import { tieRequestedAlbum } from './tieRequestedAlbum';
import type { RequestedAlbumStore } from './RequestedAlbumStore';

/**
 * Albums found as they are told to be.
 */
const albumsWith = (byGroup: string | null, byFolder: string | null) => {
  const albums = {
    findByReleaseGroup: vi.fn(() => Promise.resolve(byGroup)),
    findUnder: vi.fn(() => Promise.resolve(byFolder)),
    setReleaseGroup: vi.fn(() => Promise.resolve()),
  };

  return albums satisfies RequestedAlbumStore;
};

describe('tieRequestedAlbum', () => {
  it('finds an album by the release group its tracks are tagged with', async () => {
    const albums = albumsWith('tagged', 'filed');

    expect(await tieRequestedAlbum(albums, 'music', 'group', '/music/Pink Floyd/The Wall')).toBe(
      'tagged',
    );
    expect(albums.findUnder).not.toHaveBeenCalled();
  });

  it('finds an untagged album by where it was filed, and marks it as the release group', async () => {
    const albums = albumsWith(null, 'filed');

    expect(await tieRequestedAlbum(albums, 'music', 'group', '/music/Pink Floyd/The Wall')).toBe(
      'filed',
    );
    expect(albums.findUnder).toHaveBeenCalledWith('music', '/music/Pink Floyd/The Wall');
    expect(albums.setReleaseGroup).toHaveBeenCalledWith('filed', 'group');
  });

  it('finds nothing where the library found nothing', async () => {
    const albums = albumsWith(null, null);

    expect(await tieRequestedAlbum(albums, 'music', 'group', '/music/x')).toBeNull();
    expect(albums.setReleaseGroup).not.toHaveBeenCalled();
  });
});
