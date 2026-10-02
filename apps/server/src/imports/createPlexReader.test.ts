import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import type { FakeAnswer, FakeAsked } from './aFakeSourceFetch';
import { createSourceReader } from './createSourceReader';
import { readFixture } from './readFixture';
import type { SourceUser } from './SourceReader';

const SERVER = 'http://192.168.1.12:32400';

/**
 * A recorded answer.
 *
 * @param name - The fixture.
 * @param contentType - What kind of answer it is.
 * @returns The answer.
 */
const fixture = (name: string, contentType = 'application/json'): FakeAnswer => ({
  body: readFixture(name),
  contentType,
});

/**
 * What a Plex server and plex.tv say to the importer.
 *
 * @param asked - The request.
 * @returns The answer.
 */
const aPlex = ({ url, method }: FakeAsked): FakeAnswer | null => {
  const path = url.pathname;
  const type = url.searchParams.get('type');

  if (url.host === 'plex.tv') {
    const xml: Record<string, string> = {
      '/api/v2/user': 'plextv-user.xml',
      '/api/home/users': 'plextv-home-users.xml',
      '/api/users/': 'plextv-users.xml',
      '/api/servers/abc123machine/shared_servers': 'plextv-shared-servers.xml',
      '/api/v2/resources': 'plextv-resources.xml',
    };

    if (method === 'POST' && path === '/api/home/users/3333/switch') {
      return fixture('plextv-switch.xml', 'application/xml');
    }

    if (path.endsWith('/avatar')) {
      return { body: 'face', contentType: 'image/jpeg' };
    }

    const name = xml[path];

    return name === undefined ? null : fixture(name, 'application/xml');
  }

  const answers: Record<string, string> = {
    '/identity': 'plex-identity.json',
    '/': 'plex-root.json',
    '/library/sections': 'plex-sections.json',
    '/status/sessions/history/all': 'plex-history.json',
    '/library/sections/1/collections': 'plex-collections.json',
    '/library/sections/2/collections': 'plex-empty.json',
    '/library/collections/901/children': 'plex-collection-children.json',
    '/playlists': 'plex-playlists.json',
    '/playlists/801/items': 'plex-playlist-items.json',
    '/library/metadata/301': 'plex-markers.json',
  };

  if (path === '/library/sections/1/all') {
    return fixture('plex-movies-owner.json');
  }

  if (path === '/library/sections/2/all') {
    return fixture(type === '2' ? 'plex-shows.json' : 'plex-episodes.json');
  }

  const name = answers[path];

  return name === undefined ? null : fixture(name);
};

/**
 * A reader over a fake Plex server.
 *
 * @param userTokens - Tokens already resolved with a PIN.
 * @param answer - How the server answers, where a test needs something else.
 * @returns The reader and every request it made.
 */
const aPlexReader = (
  userTokens: Record<string, string> = {},
  answer: (asked: FakeAsked) => FakeAnswer | null = aPlex,
) => {
  const { fetch, calls } = aFakeSourceFetch(answer);
  const reader = createSourceReader(
    { kind: 'plex', url: SERVER, token: 'owner-token', clientId: 'valence-client', userTokens },
    fetch,
    ['US', 'GB'],
  );

  return { reader, calls };
};

/**
 * Finds a user the reader read, by id.
 *
 * @param users - The users.
 * @param id - Whose.
 * @returns The user.
 */
const userOf = (users: SourceUser[], id: string): SourceUser => {
  const found = users.find((user) => user.id === id);

  if (found === undefined) {
    throw new Error(`no user ${id}`);
  }

  return found;
};

describe('createPlexReader', () => {
  it('says what the server is from its identity and its own name', async () => {
    const { reader, calls } = aPlexReader();

    await expect(reader.identify()).resolves.toEqual({
      kind: 'plex',
      serverId: 'abc123machine',
      name: 'Shed',
      version: '1.41.3.9314-a0bfb8370',
    });
    expect(calls[0]?.headers).toMatchObject({
      'X-Plex-Token': 'owner-token',
      'X-Plex-Client-Identifier': 'valence-client',
      'X-Plex-Product': 'Valence',
      accept: 'application/json',
    });
  });

  it('reads the owner, Home members and friends on this server from plex.tv, each with what they may see', async () => {
    const { reader } = aPlexReader();
    const users = await reader.users();

    expect(users.map((user) => user.id)).toEqual(['1111', '2222', '3333', '4444']);
    expect(userOf(users, '1111')).toMatchObject({
      name: 'Lee & Co',
      username: 'lee',
      email: 'lee@example.test',
      isAdministrator: true,
      access: 'readable',
      libraryAccess: { kind: 'all' },
      ceiling: null,
    });
    expect(userOf(users, '2222')).toMatchObject({
      access: 'needsPin',
      isAdministrator: false,
      ceiling: { maximumAge: 8, allowsUnrated: false },
    });
    expect(userOf(users, '3333').access).toBe('readable');
    expect(userOf(users, '4444')).toMatchObject({
      access: 'readable',
      email: 'fran@example.test',
      libraryAccess: { kind: 'only', libraryIds: ['1'] },
      ceiling: { maximumAge: 13, allowsUnrated: false },
    });
  });

  it('counts a Home member as readable once their PIN gave a token', async () => {
    const { reader } = aPlexReader({ '2222': 'ash-pin-token' });

    expect(userOf(await reader.users(), '2222').access).toBe('readable');
  });

  it('falls back to the server’s own accounts where plex.tv cannot be reached', async () => {
    const { reader } = aPlexReader({}, (asked) => {
      if (asked.url.host === 'plex.tv') {
        return { status: 503, body: '' };
      }

      return asked.url.pathname === '/accounts'
        ? {
            body: JSON.stringify({
              MediaContainer: {
                Account: [
                  { id: 0, name: '' },
                  { id: 1, name: 'Lee' },
                  { id: 4444, name: 'fran' },
                ],
              },
            }),
          }
        : aPlex(asked);
    });
    const users = await reader.users();

    expect(users.map((user) => [user.id, user.access, user.isAdministrator])).toEqual([
      ['1', 'readable', true],
      ['4444', 'unreadable', false],
    ]);
  });

  it('reads films, programmes and episodes with their ids, files and numbers', async () => {
    const { reader } = aPlexReader();
    const [films, tv, pictures] = await reader.libraries();

    if (films === undefined || tv === undefined || pictures === undefined) {
      throw new Error('the libraries were not read');
    }

    expect(films).toEqual({ id: '1', name: 'Films', kind: 'movies', locations: ['/media/films'] });
    expect(pictures.kind).toBeNull();

    const [heat, alien] = await reader.items(films);
    const shows = await reader.items(tv);

    expect(heat).toMatchObject({
      id: '101',
      kind: 'movie',
      title: 'Heat',
      year: 1995,
      path: '/media/films/Heat (1995)/Heat.mkv',
      durationSeconds: 10200,
      ids: { imdb: 'tt0113277', tmdb: '949', tvdb: '1234' },
      addedAt: new Date(1704153600 * 1000),
    });
    expect(alien?.ids.imdb).toBe('tt0078748');
    expect(shows.find((item) => item.id === '201')?.ids.tvdb).toBe('79126');
    expect(shows.find((item) => item.id === '301')).toMatchObject({
      kind: 'episode',
      seriesId: '201',
      seasonNumber: 1,
      episodeNumber: 1,
    });
    expect(await reader.items(pictures)).toEqual([]);
  });

  it("reads a friend's own watching with the token plex.tv holds for them", async () => {
    const { reader, calls } = aPlexReader();
    const fran = userOf(await reader.users(), '4444');
    const states = await reader.userStates(fran);

    expect(states.find((state) => state.itemId === '101')).toEqual({
      itemId: '101',
      isPlayed: true,
      playCount: 2,
      lastPlayedAt: new Date(1709586000 * 1000),
      positionSeconds: 0,
      isFavourite: false,
      rating: 8,
    });
    expect(states.find((state) => state.itemId === '102')).toMatchObject({
      isPlayed: false,
      positionSeconds: 1200,
    });
    expect(states.find((state) => state.itemId === '201')).toMatchObject({
      isPlayed: false,
      playCount: 0,
      rating: 10,
    });

    const listings = calls.filter((call) => call.url.pathname.endsWith('/all'));

    expect(listings.every((call) => call.headers['X-Plex-Token'] === 'fran-server-token')).toBe(
      true,
    );
  });

  it('switches to a Home member without a PIN to read them, with the one request that is not a read', async () => {
    const { reader, calls } = aPlexReader();
    const jo = userOf(await reader.users(), '3333');

    await reader.userStates(jo);

    const notReads = calls.filter((call) => call.method !== 'GET');

    expect(notReads.map((call) => `${call.url.host}${call.url.pathname}`)).toEqual([
      'plex.tv/api/home/users/3333/switch',
    ]);
    expect(
      calls.find((call) => call.url.pathname === '/api/v2/resources')?.headers['X-Plex-Token'],
    ).toBe('ash-account-token');
    expect(
      calls
        .filter((call) => call.url.pathname.endsWith('/all'))
        .every((call) => call.headers['X-Plex-Token'] === 'ash-server-token'),
    ).toBe(true);
  });

  it('reads nothing for somebody whose watching cannot be read', async () => {
    const { reader } = aPlexReader();
    const ash = userOf(await reader.users(), '2222');

    expect(await reader.userStates(ash)).toEqual([]);
    expect(await reader.favouriteArtists(ash)).toEqual([]);
  });

  it('reads the owner’s plays from the server’s history, as account one', async () => {
    const { reader, calls } = aPlexReader();
    const lee = userOf(await reader.users(), '1111');

    expect(await reader.plays(lee)).toEqual([
      { key: '/status/sessions/history/9001', itemId: '101', at: new Date(1709586000 * 1000) },
      { key: '/status/sessions/history/9000', itemId: '101', at: new Date(1700000000 * 1000) },
    ]);
    expect(
      calls
        .find((call) => call.url.pathname === '/status/sessions/history/all')
        ?.url.searchParams.get('accountID'),
    ).toBe('1');
  });

  it('reads collections, and playlists except photo ones', async () => {
    const { reader } = aPlexReader();
    const lee = userOf(await reader.users(), '1111');

    expect(await reader.collections()).toEqual([
      { id: '901', name: 'Michael Mann', description: 'His films.', itemIds: ['101'] },
    ]);
    expect([...(await reader.playlists([lee])).entries()]).toEqual([
      ['1111', [{ id: '801', name: 'Late night', isShared: false, itemIds: ['101', '301'] }]],
    ]);
  });

  it('reads intro and credits markers, a final credits marker running to the end', async () => {
    const { reader } = aPlexReader();
    const [, tv] = await reader.libraries();

    if (tv === undefined) {
      throw new Error('no tv');
    }

    const episode = (await reader.items(tv)).find((item) => item.id === '301');

    if (episode === undefined) {
      throw new Error('no episode');
    }

    expect(await reader.markers(episode)).toEqual([
      { kind: 'intro', startSeconds: 30, endSeconds: 90 },
      { kind: 'credits', startSeconds: 3500, endSeconds: 3720 },
    ]);
    expect(await reader.markers({ ...episode, kind: 'series' })).toEqual([]);
  });

  it('reads a picture from plex.tv', async () => {
    const { reader } = aPlexReader();
    const users = await reader.users();

    expect((await reader.avatar(userOf(users, '1111')))?.contentType).toBe('image/jpeg');
    expect(await reader.avatar(userOf(users, '3333'))).toBeNull();
  });

  it('only reads the server itself', async () => {
    const { reader, calls } = aPlexReader();
    const users = await reader.users();

    for (const library of await reader.libraries()) {
      await reader.items(library);
    }

    await reader.userStates(userOf(users, '4444'));
    await reader.collections();

    expect(
      calls.filter((call) => call.url.host !== 'plex.tv').every((call) => call.method === 'GET'),
    ).toBe(true);
  });
});

describe('createPlexReader, reading a server that says as little as it may', () => {
  /**
   * An answer of some JSON.
   *
   * @param body - What to answer.
   * @returns The answer.
   */
  const json = (body: object): FakeAnswer => ({ body: JSON.stringify(body) });

  /**
   * A Plex with plex.tv out of reach, answering with only the fields it must.
   *
   * @param asked - The request.
   * @returns The answer.
   */
  const aSparsePlex = ({ url }: FakeAsked): FakeAnswer | null => {
    const path = url.pathname;

    if (url.host === 'plex.tv') {
      return { status: 503, body: '' };
    }

    const answers: Record<string, object> = {
      '/identity': { MediaContainer: { machineIdentifier: 'quiet-machine' } },
      '/': { MediaContainer: {} },
      '/accounts': { MediaContainer: { Account: [{ id: 1 }, { id: 7 }] } },
      '/library/sections': { MediaContainer: { Directory: [{ key: '7', type: 'artist' }] } },
      '/library/sections/7/collections': { MediaContainer: { Metadata: [{ ratingKey: 'c1' }] } },
      '/library/collections/c1/children': { MediaContainer: {} },
      '/playlists': { MediaContainer: { Metadata: [{ ratingKey: 'p1' }] } },
      '/playlists/p1/items': { MediaContainer: { Metadata: [{ ratingKey: 't1' }] } },
      '/status/sessions/history/all': {
        MediaContainer: {
          Metadata: [{ ratingKey: 't1', viewedAt: 1_700_000_000 }, { ratingKey: 't2' }],
        },
      },
    };

    if (path === '/library/sections/7/all') {
      return url.searchParams.get('type') === '10'
        ? json({
            MediaContainer: {
              Metadata: [
                { ratingKey: 't1', type: 'track', parentRatingKey: 'a1', parentIndex: 1, index: 2 },
                { ratingKey: 't2', type: 'track', viewCount: 1 },
                { ratingKey: 'x' },
              ],
            },
          })
        : json({ MediaContainer: {} });
    }

    const answer = answers[path];

    return answer === undefined ? null : json(answer);
  };

  const aSparseReader = () => aPlexReader({}, aSparsePlex).reader;

  it('names the server Plex and its version 0 where it does not say', async () => {
    await expect(aSparseReader().identify()).resolves.toEqual({
      kind: 'plex',
      serverId: 'quiet-machine',
      name: 'Plex',
      version: '0',
    });
  });

  it('names an account by its number where the server has no name for it', async () => {
    const users = await aSparseReader().users();

    expect(users.map((user) => [user.id, user.name, user.username])).toEqual([
      ['1', '1', null],
      ['7', '7', null],
    ]);
  });

  it('names a library by its key, nowhere on disk', async () => {
    expect(await aSparseReader().libraries()).toEqual([
      { id: '7', name: '7', kind: 'music', locations: [] },
    ]);
  });

  it('reads tracks with and without their album and numbers, and items of no kind it knows', async () => {
    const reader = aSparseReader();
    const [music] = await reader.libraries();
    const items = music === undefined ? [] : await reader.items(music);

    expect(
      items.map((item) => [item.id, item.kind, item.albumId, item.discNumber, item.trackNumber]),
    ).toEqual([
      ['t1', 'track', 'a1', 1, 2],
      ['t2', 'track', null, null, null],
      ['x', 'other', null, null, null],
    ]);
    expect(items.map((item) => item.title)).toEqual(['', '', '']);
  });

  it('reads the owner’s watching, plays, collections and playlists, naming each by its key', async () => {
    const reader = aSparseReader();
    const users = await reader.users();
    const owner = userOf(users, '1');

    expect(await reader.userStates(owner)).toEqual([
      {
        itemId: 't2',
        isPlayed: true,
        playCount: 1,
        lastPlayedAt: null,
        positionSeconds: 0,
        isFavourite: false,
        rating: null,
      },
    ]);
    expect(await reader.plays(owner)).toEqual([
      { key: '1:t1:1700000000000', itemId: 't1', at: new Date(1_700_000_000_000) },
    ]);
    expect(await reader.collections()).toEqual([
      { id: 'c1', name: 'c1', description: null, itemIds: [] },
    ]);
    expect(await reader.playlists(users)).toEqual(
      new Map([['1', [{ id: 'p1', name: 'p1', isShared: false, itemIds: ['t1'] }]]]),
    );
  });

  it('reads nothing for somebody the server does not know', async () => {
    const reader = aSparseReader();
    const [owner] = await reader.users();

    if (owner === undefined) {
      throw new Error('nobody');
    }

    expect(await reader.userStates({ ...owner, id: 'stranger' })).toEqual([]);
  });

  it('finds no markers on an item the server says nothing of', async () => {
    const reader = aSparseReader();
    const [music] = await reader.libraries();
    const [track] = music === undefined ? [] : await reader.items(music);

    if (track === undefined) {
      throw new Error('no track');
    }

    expect(await reader.markers({ ...track, kind: 'movie' })).toEqual([]);
    expect(await reader.markers(track)).toEqual([]);
  });
});
