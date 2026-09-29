import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aTrack } from '@ValenceClient/testing/aTrack';
import { anAlbum } from '@ValenceMobile/testing/anAlbum';
import { anArtist } from '@ValenceMobile/testing/anArtist';
import { sectionsForAnArtist } from './sectionsForAnArtist';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://valence.test' }));
});

describe('sectionsForAnArtist', () => {
  it('lists their popular songs by place, then their albums', () => {
    const popular = Array.from({ length: 12 }, (_, n) => aTrack(n + 1));
    const [songs, albums] = sectionsForAnArtist({
      artist: anArtist(),
      albums: [anAlbum()],
      appearsOn: [],
      popular: [
        ...popular.slice(0, 1),
        aTrack(99, {
          album: {
            id: '00000000-0000-4000-8000-00000000b2b2',
            title: 'Sundowning',
            hasArtwork: false,
          },
        }),
        ...popular.slice(1),
      ],
    });

    expect(songs?.title).toBe('Popular');
    expect(songs?.rows).toHaveLength(10);
    expect(songs?.rows[0]).toMatchObject({
      id: 'song:00000000-0000-4000-8000-00000000a7a7:0',
      title: 'Track 1',
    });
    expect(songs?.rows[0]?.artwork).toContain('/artwork');
    expect(songs?.rows[1]?.artwork).toBeNull();
    expect(albums?.rows.map((row) => row.title)).toEqual(['Even In Arcadia']);
  });
});
