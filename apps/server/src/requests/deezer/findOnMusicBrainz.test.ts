import { describe, expect, it, vi } from 'vitest';
import { findOnMusicBrainz } from './findOnMusicBrainz';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const THE_WALL = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * A way out to the web that answers each address with what it is given.
 */
const aWeb = (answers: Record<string, JsonValue>) => {
  const web = {
    json: vi.fn((url: string): Promise<JsonValue | null> =>
      Promise.resolve(Object.entries(answers).find(([path]) => url.includes(path))?.[1] ?? null),
    ),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('findOnMusicBrainz', () => {
  it('finds a Deezer album in MusicBrainz by its title and artist', async () => {
    const web = aWeb({
      'api.deezer.com/album/7': { title: 'The Wall', artist: { name: 'Pink Floyd' } },
      'musicbrainz.org/ws/2/release-group': {
        'release-groups': [{ id: THE_WALL, score: 100 }],
      },
    });

    expect(await findOnMusicBrainz(web, 'album', 7)).toBe(THE_WALL);
    expect(web.json).toHaveBeenLastCalledWith(
      `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent('releasegroup:"The Wall" AND artist:"Pink Floyd"')}&fmt=json&limit=3`,
    );
  });

  it('finds a Deezer artist, but only where MusicBrainz is sure', async () => {
    const sure = aWeb({
      'api.deezer.com/artist/2': { name: 'Pink Floyd' },
      'musicbrainz.org/ws/2/artist': { artists: [{ id: THE_WALL, score: 95 }] },
    });
    const unsure = aWeb({
      'api.deezer.com/artist/2': { name: 'Pink Floyd' },
      'musicbrainz.org/ws/2/artist': { artists: [{ id: THE_WALL, score: 60 }] },
    });

    expect(await findOnMusicBrainz(sure, 'artist', 2)).toBe(THE_WALL);
    expect(await findOnMusicBrainz(unsure, 'artist', 2)).toBeNull();
  });

  it('finds nothing where Deezer does not know it', async () => {
    expect(await findOnMusicBrainz(aWeb({}), 'album', 7)).toBeNull();
  });
});
