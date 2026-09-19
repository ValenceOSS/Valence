import { describe, expect, it, vi } from 'vitest';
import { searchMusicCatalogue } from './searchMusicCatalogue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * A way out to the web that answers every question with what it is given.
 */
const aWeb = (answer: JsonValue | null) => {
  const web = {
    json: vi.fn((): Promise<JsonValue | null> => Promise.resolve(answer)),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('searchMusicCatalogue', () => {
  it('finds artists, with what tells them apart and when they began', async () => {
    const fine = aWeb({
      artists: [
        {
          id: '83d91898-7763-47d7-b03b-b92132375c47',
          name: 'Pink Floyd',
          disambiguation: 'UK rock band',
          'life-span': { begin: '1965' },
        },
        { id: 'not an id', name: 'Broken' },
      ],
    });

    expect(await searchMusicCatalogue(fine, 'pink floyd', 'artist')).toEqual([
      {
        kind: 'artist',
        musicBrainzId: '83d91898-7763-47d7-b03b-b92132375c47',
        title: 'Pink Floyd',
        artist: null,
        disambiguation: 'UK rock band',
        type: null,
        year: 1965,
        coverUrl: null,
      },
    ]);
    expect(fine.json).toHaveBeenCalledWith(
      'https://musicbrainz.org/ws/2/artist/?query=pink%20floyd&fmt=json&limit=15',
    );
  });

  it('finds albums with their artist, kind, year and cover, skipping any it cannot read', async () => {
    const web = aWeb({
      'release-groups': [
        {
          id: 'f5093c06-23e3-404f-aeaa-40f72885ee3a',
          title: 'The Dark Side of the Moon',
          'primary-type': 'Album',
          'secondary-types': [],
          'first-release-date': '1973-03-01',
          'artist-credit': [{ name: 'Pink Floyd', joinphrase: '' }],
        },
        { id: 'not an id', title: 'Broken' },
      ],
    });

    expect(await searchMusicCatalogue(web, 'dark side: moon', 'album')).toEqual([
      {
        kind: 'album',
        musicBrainzId: 'f5093c06-23e3-404f-aeaa-40f72885ee3a',
        title: 'The Dark Side of the Moon',
        artist: 'Pink Floyd',
        disambiguation: null,
        type: 'album',
        year: 1973,
        coverUrl:
          'https://coverartarchive.org/release-group/f5093c06-23e3-404f-aeaa-40f72885ee3a/front-250',
      },
    ]);
    expect(web.json).toHaveBeenCalledWith(
      'https://musicbrainz.org/ws/2/release-group/?query=dark%20side%5C%3A%20moon&fmt=json&limit=15',
    );
  });

  it('asks nothing for nothing typed, and finds nothing where MusicBrainz says nothing', async () => {
    const web = aWeb(null);

    expect(await searchMusicCatalogue(web, '  ', 'artist')).toEqual([]);
    expect(web.json).not.toHaveBeenCalled();
    expect(await searchMusicCatalogue(web, 'pink floyd', 'album')).toEqual([]);
  });
});
