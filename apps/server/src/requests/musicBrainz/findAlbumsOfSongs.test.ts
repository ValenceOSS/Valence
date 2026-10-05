import { describe, expect, it, vi } from 'vitest';
import { findAlbumsOfSongs } from './findAlbumsOfSongs';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const ISLES = {
  id: 'fa402a46-b4b1-40d6-8d3b-b051550eb687',
  title: 'Isles',
  'primary-type': 'Album',
  'secondary-types': [],
  'first-release-date': '2021-01-22',
  disambiguation: '',
};

const BICEP = [{ name: 'Bicep', joinphrase: '' }];

const RELEASE = '32d2437b-3975-4445-a5b3-b4e6ceb35fd9';

const song = (title: string, album: string | null, releaseId: string | null = null) => ({
  title,
  artist: 'Bicep',
  album,
  releaseId,
});

/**
 * A way out to the web that answers each of MusicBrainz's searches with what it is given.
 */
const aWeb = (answers: Partial<Record<'release' | 'release-group' | 'recording', JsonValue>>) => {
  const web = {
    json: vi.fn((url: string): Promise<JsonValue | null> => {
      const index = /\/ws\/2\/([a-z-]+)\//u.exec(url)?.[1];

      return Promise.resolve(
        index === 'release' || index === 'release-group' || index === 'recording'
          ? (answers[index] ?? null)
          : null,
      );
    }),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(null)),
    text: vi.fn((): Promise<string | null> => Promise.resolve(null)),
  };

  return web satisfies MusicWeb;
};

describe('findAlbumsOfSongs', () => {
  it('finds every song named on a release in one search', async () => {
    const web = aWeb({
      release: {
        releases: [{ id: RELEASE, 'artist-credit': BICEP, 'release-group': ISLES }],
      },
    });

    const found = await findAlbumsOfSongs(web, [
      song('Apricots', 'Isles', RELEASE),
      song('Atlas', 'Isles', RELEASE),
    ]);

    expect(found.map((album) => album?.musicBrainzId)).toEqual([ISLES.id, ISLES.id]);
    expect(found[0]).toMatchObject({ title: 'Isles', artist: 'Bicep', year: 2021 });
    expect(web.json).toHaveBeenCalledOnce();
    expect(web.json).toHaveBeenCalledWith(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(`reid:${RELEASE} OR reid:${RELEASE}`)}&fmt=json&limit=100`,
    );
  });

  it('finds albums by name and artist many to a search, give or take an edition', async () => {
    const web = aWeb({
      'release-group': {
        'release-groups': [
          {
            ...ISLES,
            id: '00000000-0000-4000-8000-000000000001',
            title: 'Isles Remixed',
            'artist-credit': BICEP,
          },
          { ...ISLES, 'artist-credit': BICEP },
          {
            ...ISLES,
            id: '00000000-0000-4000-8000-000000000002',
            title: 'Bicep',
            'artist-credit': BICEP,
          },
        ],
      },
    });

    const found = await findAlbumsOfSongs(web, [
      song('Apricots', 'Isles (Deluxe)'),
      song('Glue', 'Bicep'),
      song('Nowhere', 'Unknown'),
    ]);

    expect(found.map((album) => album?.title ?? null)).toEqual(['Isles', 'Bicep', null]);
    expect(web.json).toHaveBeenCalledOnce();
    expect(web.json).toHaveBeenCalledWith(
      `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(
        '(releasegroup:"Isles" AND artist:"Bicep") OR (releasegroup:"Bicep" AND artist:"Bicep") OR (releasegroup:"Unknown" AND artist:"Bicep")',
      )}&fmt=json&limit=100`,
    );
  });

  it('looks for a release it could not find by its album’s name instead', async () => {
    const web = aWeb({
      release: { releases: [] },
      'release-group': { 'release-groups': [{ ...ISLES, 'artist-credit': BICEP }] },
    });

    expect(
      (await findAlbumsOfSongs(web, [song('Apricots', 'Isles', RELEASE)]))[0]?.musicBrainzId,
    ).toBe(ISLES.id);
  });

  it('asks again one song at a time where a search came back too full to trust', async () => {
    const crowd = Array.from({ length: 100 }, (_, at) => ({
      ...ISLES,
      id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
      title: `Other ${at.toString()}`,
      'artist-credit': BICEP,
    }));
    const web = aWeb({ 'release-group': { 'release-groups': crowd } });

    await findAlbumsOfSongs(web, [song('Apricots', 'Isles'), song('Glue', 'Bicep')]);

    expect(web.json).toHaveBeenCalledTimes(3);
    expect(web.json.mock.calls[2]?.[0]).toContain('&limit=10');
  });

  it('finds the album a song with no album named is best known from', async () => {
    const web = aWeb({
      recording: {
        recordings: [
          {
            title: 'Apricots',
            'artist-credit': BICEP,
            releases: [
              {
                'release-group': {
                  ...ISLES,
                  id: '00000000-0000-4000-8000-000000000003',
                  'secondary-types': ['Compilation'],
                },
              },
              {
                'release-group': {
                  ...ISLES,
                  id: '00000000-0000-4000-8000-000000000004',
                  'primary-type': 'Single',
                },
              },
              { 'release-group': ISLES },
            ],
          },
        ],
      },
    });

    expect((await findAlbumsOfSongs(web, [song('Apricots', null)]))[0]).toMatchObject({
      musicBrainzId: ISLES.id,
      artist: 'Bicep',
    });
  });

  it('finds nothing where MusicBrainz cannot be asked, and asks nothing for nothing', async () => {
    expect(await findAlbumsOfSongs(aWeb({}), [song('Apricots', 'Isles', RELEASE)])).toEqual([null]);

    const idle = aWeb({});

    expect(await findAlbumsOfSongs(idle, [])).toEqual([]);
    expect(idle.json).not.toHaveBeenCalled();
  });
});
