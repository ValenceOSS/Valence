import { describe, expect, it, vi } from 'vitest';
import { describeAlbumForRequest } from './describeAlbumForRequest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const THE_WALL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * A way out to the web that answers with what it is given.
 */
const aWeb = (answer: JsonValue | null) => {
  const web = {
    json: vi.fn((): Promise<JsonValue | null> => Promise.resolve(answer)),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('describeAlbumForRequest', () => {
  it('describes an album, who it is by, when it came out and its cover', async () => {
    const web = aWeb({
      id: THE_WALL,
      title: 'The Wall',
      'primary-type': 'Album',
      'secondary-types': [],
      'first-release-date': '1979-11-30',
      'artist-credit': [{ name: 'Pink Floyd', joinphrase: '' }],
    });

    expect(await describeAlbumForRequest(web, THE_WALL)).toEqual({
      title: 'The Wall',
      year: 1979,
      aliases: [],
      overview: null,
      posterUrl: `https://coverartarchive.org/release-group/${THE_WALL}/front-250`,
      runtimeMinutes: null,
      releaseDates: { theatrical: null, digital: null, physical: null },
      episodes: [],
      isEnded: false,
      artist: 'Pink Floyd',
      albums: [{ id: THE_WALL, title: 'The Wall', type: 'album', firstReleased: '1979-11-30' }],
    });
    expect(web.json).toHaveBeenCalledWith(
      `https://musicbrainz.org/ws/2/release-group/${THE_WALL}?inc=artist-credits&fmt=json`,
    );
  });

  it('knows nothing of an album MusicBrainz cannot be asked about', async () => {
    expect(await describeAlbumForRequest(aWeb(null), THE_WALL)).toBeNull();
  });
});
