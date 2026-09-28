import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchMusicCatalogue } from '@ValenceServer/requests/musicBrainz/searchMusicCatalogue';
import { createAlbumCorrections } from './createAlbumCorrections';
import { findAppleAlbumCoverUrl } from './findAppleAlbumCoverUrl';
import type { AlbumCorrectingStore } from './AlbumCorrectingStore';
import type { MusicWeb } from './createMusicWeb';

vi.mock('./findAppleAlbumCoverUrl', () => ({ findAppleAlbumCoverUrl: vi.fn() }));
vi.mock('@ValenceServer/requests/musicBrainz/searchMusicCatalogue', () => ({
  searchMusicCatalogue: vi.fn(),
}));

const COVER = new Uint8Array([1, 2]);

const APPLE_COVER = new Uint8Array([3]);

const CHOSEN = { releaseGroupId: 'rg-1', title: 'Silent Alarm', artist: 'Bloc Party' };

/**
 * A way out to the web whose Cover Art Archive has the cover or not, and which fetches Apple's.
 */
const aWeb = (isArchived: boolean) =>
  ({
    json: vi.fn(() => Promise.resolve(null)),
    text: vi.fn(() => Promise.resolve(null)),
    bytes: vi.fn((url: string): Promise<Uint8Array | null> =>
      Promise.resolve(
        url.includes('coverartarchive.org')
          ? isArchived
            ? COVER
            : null
          : url === 'https://apple/cover.jpg'
            ? APPLE_COVER
            : null,
      ),
    ),
  }) satisfies MusicWeb;

const aStore = () =>
  ({
    correctAlbum: vi.fn(() => Promise.resolve(true)),
    forgetAlbumCorrection: vi.fn(() => Promise.resolve(true)),
  }) satisfies AlbumCorrectingStore;

const anArtwork = () => ({
  keep: vi.fn((kind: 'album' | 'artist', id: string) => Promise.resolve(`/art/${kind}-${id}.webp`)),
  isKept: vi.fn(() => Promise.resolve(true)),
});

beforeEach(() => {
  vi.mocked(findAppleAlbumCoverUrl).mockReset().mockResolvedValue('https://apple/cover.jpg');
  vi.mocked(searchMusicCatalogue).mockReset().mockResolvedValue([]);
});

describe('createAlbumCorrections', () => {
  it('searches MusicBrainz for albums', async () => {
    const web = aWeb(true);

    await createAlbumCorrections({ store: aStore(), web, artwork: anArtwork() }).search('silent');

    expect(searchMusicCatalogue).toHaveBeenCalledWith(web, 'silent', 'album');
  });

  it('corrects an album to the chosen record with the archive’s cover', async () => {
    const store = aStore();
    const artwork = anArtwork();

    expect(
      await createAlbumCorrections({ store, web: aWeb(true), artwork }).correct('a1', CHOSEN),
    ).toBe(true);
    expect(artwork.keep).toHaveBeenCalledWith('album', 'a1', { bytes: COVER });
    expect(findAppleAlbumCoverUrl).not.toHaveBeenCalled();
    expect(store.correctAlbum).toHaveBeenCalledWith('a1', 'rg-1', '/art/album-a1.webp');
  });

  it('takes Apple’s cover where the archive has none', async () => {
    const artwork = anArtwork();

    await createAlbumCorrections({ store: aStore(), web: aWeb(false), artwork }).correct(
      'a1',
      CHOSEN,
    );

    expect(findAppleAlbumCoverUrl).toHaveBeenCalledWith(expect.anything(), {
      title: 'Silent Alarm',
      artistName: 'Bloc Party',
    });
    expect(artwork.keep).toHaveBeenCalledWith('album', 'a1', { bytes: APPLE_COVER });
  });

  it('corrects the album without a cover where none can be found', async () => {
    const store = aStore();
    const artwork = anArtwork();

    await createAlbumCorrections({ store, web: aWeb(false), artwork }).correct('a1', {
      ...CHOSEN,
      artist: null,
    });

    expect(findAppleAlbumCoverUrl).not.toHaveBeenCalled();
    expect(artwork.keep).not.toHaveBeenCalled();
    expect(store.correctAlbum).toHaveBeenCalledWith('a1', 'rg-1', null);
  });

  it('forgets a correction', async () => {
    const store = aStore();

    expect(
      await createAlbumCorrections({ store, web: aWeb(true), artwork: anArtwork() }).forget('a1'),
    ).toBe(true);
    expect(store.forgetAlbumCorrection).toHaveBeenCalledWith('a1');
  });
});
