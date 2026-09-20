import { describe, expect, it, vi } from 'vitest';
import { describeArtistForRequest } from './describeArtistForRequest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const PINK_FLOYD = '83d91898-7763-47d7-b03b-b92132375c47';

/**
 * A release group as MusicBrainz lists one, numbered.
 */
const aGroup = (number: number, type = 'Album', date = '1979-11-30') => ({
  id: `00000000-0000-4000-8000-${number.toString().padStart(12, '0')}`,
  title: `Album ${number.toString()}`,
  'primary-type': type,
  'secondary-types': [],
  'first-release-date': date,
});

/**
 * A way out to the web that knows Pink Floyd, with as many release groups as it is given.
 */
const aWeb = (groups: readonly JsonValue[], artist: JsonValue | null = null) => {
  const web = {
    json: vi.fn((url: string): Promise<JsonValue | null> => {
      if (url.includes('/artist/')) {
        return Promise.resolve(
          artist ?? {
            id: PINK_FLOYD,
            name: 'Pink Floyd',
            disambiguation: 'UK rock band',
            'life-span': { ended: true },
            aliases: [{ name: 'The Pink Floyd' }, { name: 'Pink Floyd' }],
          },
        );
      }

      const offset = Number(new URL(url).searchParams.get('offset'));

      return Promise.resolve({
        'release-group-count': groups.length,
        'release-groups': groups.slice(offset, offset + 100),
      });
    }),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('describeArtistForRequest', () => {
  it('describes an artist, the names they go by, and every release group of theirs', async () => {
    const web = aWeb([
      aGroup(1, 'Album', '1973-03-01'),
      aGroup(2, 'Album', '1979-11-30'),
      aGroup(3, 'Single'),
    ]);

    expect(await describeArtistForRequest(web, PINK_FLOYD)).toEqual({
      title: 'Pink Floyd',
      year: null,
      aliases: ['The Pink Floyd'],
      overview: 'UK rock band',
      posterUrl:
        'https://coverartarchive.org/release-group/00000000-0000-4000-8000-000000000002/front-250',
      runtimeMinutes: null,
      releaseDates: { theatrical: null, digital: null, physical: null },
      episodes: [],
      isEnded: true,
      artist: 'Pink Floyd',
      albums: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          title: 'Album 1',
          type: 'album',
          firstReleased: '1973-03-01',
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          title: 'Album 2',
          type: 'album',
          firstReleased: '1979-11-30',
        },
        {
          id: '00000000-0000-4000-8000-000000000003',
          title: 'Album 3',
          type: 'single',
          firstReleased: '1979-11-30',
        },
      ],
    });
  });

  it('reads every page of an artist with more release groups than fit on one', async () => {
    const web = aWeb(Array.from({ length: 250 }, (_, index) => aGroup(index + 1)));

    const described = await describeArtistForRequest(web, PINK_FLOYD);

    expect(described?.albums).toHaveLength(250);
    expect(web.json).toHaveBeenCalledTimes(4);
  });

  it('knows nothing of an artist MusicBrainz does not know, or cannot be asked about', async () => {
    expect(await describeArtistForRequest(aWeb([], { error: 'Not Found' }), PINK_FLOYD)).toBeNull();
  });
});
