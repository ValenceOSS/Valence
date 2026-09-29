import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { anArtist } from '@ValenceMobile/testing/anArtist';
import { aPlaylist } from '@ValenceMobile/testing/aPlaylist';
import { shelvesForTheCar } from './shelvesForTheCar';

const NOTHING = { liked: [], newest: [], albums: [], playlists: [], artists: [] };

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://valence.test' }));
});

describe('shelvesForTheCar', () => {
  it('has the four tabs in order', () => {
    expect(shelvesForTheCar(NOTHING).map((shelf) => shelf.title)).toEqual([
      'Listen Now',
      'Playlists',
      'Albums',
      'Artists',
    ]);
  });

  it('offers liked songs only when there are some, with a cover from one of them', () => {
    const [empty] = shelvesForTheCar(NOTHING);
    const [listen] = shelvesForTheCar({ ...NOTHING, liked: [aTrack(1), aTrack(2)] });

    expect(empty?.sections[0]?.rows).toEqual([]);
    expect(listen?.sections[0]?.rows[0]).toMatchObject({
      id: 'liked',
      detail: '2 songs',
      artwork: 'http://valence.test/api/music/albums/00000000-0000-4000-8000-00000000a1b1/artwork',
    });
  });

  it('keeps the newest albums to a short list', () => {
    const newest = Array.from({ length: 20 }, (_, n) =>
      anAlbum({ id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}` }),
    );
    const [listen] = shelvesForTheCar({ ...NOTHING, newest });

    expect(listen?.sections[1]?.rows).toHaveLength(12);
  });

  it('pictures a playlist by its own cover, then by its first album', () => {
    const shelves = shelvesForTheCar({
      ...NOTHING,
      playlists: [
        aPlaylist({ hasOwnArtwork: true }),
        aPlaylist({ artworkAlbumIds: ['00000000-0000-4000-8000-00000000a1b1'] }),
        aPlaylist({ entryCount: 1 }),
      ],
    });
    const rows = shelves[1]?.sections[0]?.rows ?? [];

    expect(rows[0]?.artwork).toContain(
      '/api/playlists/00000000-0000-4000-8000-0000000000aa/artwork',
    );
    expect(rows[1]?.artwork).toContain(
      '/api/music/albums/00000000-0000-4000-8000-00000000a1b1/artwork',
    );
    expect(rows[2]).toMatchObject({ artwork: null, detail: '1 song' });
  });

  it('opens an artist rather than playing them, pictured by their own image or an album', () => {
    const shelves = shelvesForTheCar({
      ...NOTHING,
      artists: [
        anArtist({ hasImage: true }),
        anArtist({ imageAlbumId: '00000000-0000-4000-8000-00000000a1b1', albumCount: 1 }),
        anArtist(),
      ],
    });
    const rows = shelves[3]?.sections[0]?.rows ?? [];

    expect(rows[0]).toMatchObject({
      id: 'artist:00000000-0000-4000-8000-00000000a7a7',
      opens: true,
    });
    expect(rows[0]?.artwork).toContain('/api/music/artists/');
    expect(rows[1]).toMatchObject({ detail: '1 album' });
    expect(rows[1]?.artwork).toContain('/api/music/albums/');
    expect(rows[2]?.artwork).toBeNull();
  });
});
