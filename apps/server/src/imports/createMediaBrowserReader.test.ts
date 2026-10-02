import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import type { FakeAnswer, FakeAsked } from './aFakeSourceFetch';
import { createSourceReader } from './createSourceReader';
import { readFixture } from './readFixture';
import { NO_IDS } from './NO_IDS';
import { SourceFailure } from './SourceFailure';
import type { SourceItem, SourceUser } from './SourceReader';

const PAT = '6d2b1a3e-0000-4000-8000-000000000001';

const SAM = '6d2b1a3e-0000-4000-8000-000000000002';

const REGIONS = ['US', 'GB'];

/**
 * A recorded answer.
 *
 * @param name - The fixture.
 * @returns The answer.
 */
const fixture = (name: string): FakeAnswer => ({ body: readFixture(name) });

/**
 * What a Jellyfin server says to the importer, by path and query.
 *
 * @param info - Which public information it gives, which decides its version.
 * @param ratings - Which parental rating table it has.
 * @returns How it answers.
 */
const aJellyfin =
  (info: string, ratings: string) =>
  ({ url }: FakeAsked): FakeAnswer | null => {
    const query = url.searchParams;
    const path = url.pathname;
    const user = query.get('UserId') ?? /^\/Users\/([^/]+)\/Items$/.exec(path)?.[1] ?? null;

    if (path === '/System/Info/Public' || path === '/System/Info') {
      return fixture(info);
    }

    if (path === '/Users') {
      return fixture('jellyfin-users.json');
    }

    if (path === '/Library/VirtualFolders') {
      return fixture('jellyfin-folders.json');
    }

    if (path === '/Localization/ParentalRatings') {
      return fixture(ratings);
    }

    if (path === '/Items' || /^\/Users\/[^/]+\/Items$/.test(path)) {
      const parent = query.get('ParentId');
      const types = query.get('IncludeItemTypes');
      const filter = query.get('Filters');
      const byParent: Record<string, string> = {
        'lib-films': 'jellyfin-films.json',
        'lib-shows': 'jellyfin-shows.json',
        'lib-music': 'jellyfin-music.json',
        'boxset-1': 'jellyfin-boxset-entries.json',
      };

      if (parent !== null) {
        return fixture(byParent[parent] ?? 'jellyfin-empty.json');
      }

      if (types === 'BoxSet') {
        return fixture('jellyfin-boxsets.json');
      }

      if (types === 'Playlist') {
        return fixture(user === PAT ? 'jellyfin-playlists.json' : 'jellyfin-empty.json');
      }

      if (user === PAT && filter === 'IsFavorite') {
        return fixture(
          types === 'MusicArtist'
            ? 'jellyfin-favourite-artists.json'
            : 'jellyfin-pat-favourites.json',
        );
      }

      if (user === PAT && filter === 'IsPlayed') {
        return fixture('jellyfin-pat-played.json');
      }

      if (user === PAT && filter === 'IsResumable') {
        return fixture('jellyfin-pat-resumable.json');
      }

      return fixture('jellyfin-empty.json');
    }

    if (path === '/Playlists/playlist-1') {
      return fixture('jellyfin-playlist.json');
    }

    if (path === '/Playlists/playlist-1/Items') {
      return fixture('jellyfin-playlist-items.json');
    }

    if (path === '/MediaSegments/item-wire-101') {
      return fixture('jellyfin-segments.json');
    }

    if (
      path === '/Episode/item-wire-101/IntroTimestamps/v1' &&
      query.get('mode') === 'Introduction'
    ) {
      return fixture('intro-skipper-introduction.json');
    }

    if (path === '/UserImage' || path.endsWith('/Images/Primary')) {
      return { body: 'picture', contentType: 'image/png' };
    }

    return null;
  };

/**
 * A reader over a fake Jellyfin.
 *
 * @param info - Its public information.
 * @param ratings - Its rating table.
 * @returns The reader, and every request it made.
 */
const aJellyfinReader = (
  info = 'jellyfin-public-info.json',
  ratings = 'jellyfin-parental-ratings.json',
) => {
  const { fetch, calls } = aFakeSourceFetch(aJellyfin(info, ratings));
  const reader = createSourceReader(
    { kind: 'jellyfin', url: 'http://192.168.1.10:8096/', token: 'the-key', clientId: 'client' },
    fetch,
    REGIONS,
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

/**
 * Finds an item the reader read, by id.
 *
 * @param items - The items.
 * @param id - Which.
 * @returns The item.
 */
const itemOf = (items: SourceItem[], id: string): SourceItem => {
  const found = items.find((item) => item.id === id);

  if (found === undefined) {
    throw new Error(`no item ${id}`);
  }

  return found;
};

describe('createMediaBrowserReader, reading Jellyfin 12', () => {
  it('says what the server is, checking the key works', async () => {
    const { reader, calls } = aJellyfinReader();

    await expect(reader.identify()).resolves.toEqual({
      kind: 'jellyfin',
      serverId: 'f1e2d3c4b5a6',
      name: 'Den',
      version: '12.1.0',
    });
    expect(calls.map((call) => call.url.pathname)).toEqual(['/System/Info/Public', '/System/Info']);
    expect(calls[1]?.headers.Authorization).toContain('Token="the-key"');
    expect(calls[1]?.headers['X-Emby-Token']).toBeUndefined();
  });

  it('refuses an Emby server chosen as Jellyfin', async () => {
    const { fetch } = aFakeSourceFetch(() => fixture('emby-public-info.json'));
    const reader = createSourceReader(
      { kind: 'jellyfin', url: 'http://x', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );

    await expect(reader.identify()).rejects.toBeInstanceOf(SourceFailure);
  });

  it('reads each user with their rights, libraries, ceiling through the server’s own ratings, and picture', async () => {
    const { reader } = aJellyfinReader();
    const users = await reader.users();

    expect(userOf(users, PAT)).toMatchObject({
      name: 'Pat',
      username: 'Pat',
      email: null,
      isAdministrator: true,
      isDisabled: false,
      access: 'readable',
      libraryAccess: { kind: 'all' },
      ceiling: null,
      avatarUrl: `/UserImage?userId=${PAT}&tag=tag-pat`,
    });
    expect(userOf(users, SAM)).toMatchObject({
      libraryAccess: { kind: 'only', libraryIds: ['lib-films'] },
      ceiling: { maximumAge: 13, allowsUnrated: false },
      avatarUrl: null,
    });
    expect(userOf(users, '6d2b1a3e-0000-4000-8000-000000000003')).toMatchObject({
      isDisabled: true,
      libraryAccess: { kind: 'only', libraryIds: ['lib-films', 'lib-shows', 'lib-photos'] },
    });
  });

  it('reads the libraries, with no kind for one Valence cannot hold', async () => {
    const { reader } = aJellyfinReader();

    expect(await reader.libraries()).toEqual([
      { id: 'lib-films', name: 'Films', kind: 'movies', locations: ['/data/movies'] },
      { id: 'lib-shows', name: 'Shows', kind: 'shows', locations: ['/data/tv', '/data/tv-extra'] },
      { id: 'lib-music', name: 'Music', kind: 'music', locations: ['/data/music'] },
      { id: 'lib-photos', name: 'Photos', kind: null, locations: ['/data/photos'] },
    ]);
  });

  it('reads films, episodes and tracks with their ids, numbers and lengths', async () => {
    const { reader, calls } = aJellyfinReader();
    const [films, shows, music, photos] = await reader.libraries();

    if (films === undefined || shows === undefined || music === undefined || photos === undefined) {
      throw new Error('the libraries were not read');
    }

    const heat = itemOf(await reader.items(films), 'item-heat');
    const episodes = await reader.items(shows);
    const tracks = await reader.items(music);

    expect(heat).toMatchObject({
      kind: 'movie',
      libraryId: 'lib-films',
      title: 'Heat',
      year: 1995,
      path: '/data/movies/Heat (1995)/Heat.mkv',
      durationSeconds: 10200,
      ids: { tmdb: '949', imdb: 'tt0113277' },
    });
    expect(itemOf(episodes, 'item-wire-101')).toMatchObject({
      kind: 'episode',
      seriesId: 'item-wire',
      seasonNumber: 1,
      episodeNumber: 1,
    });
    expect(itemOf(episodes, 'item-wire').ids.tvdb).toBe('79126');
    expect(itemOf(tracks, 'item-track')).toMatchObject({
      kind: 'track',
      albumId: 'item-album',
      discNumber: 1,
      trackNumber: 3,
      ids: { musicBrainzAlbum: '2c0a3d1e-aaaa-4bbb-8ccc-000000000001' },
    });
    expect(await reader.items(photos)).toEqual([]);

    const catalogueCall = calls.find(
      (call) => call.url.searchParams.get('ParentId') === 'lib-films',
    );

    expect(catalogueCall?.url.pathname).toBe('/Items');
    expect(catalogueCall?.url.searchParams.get('UserId')).toBeNull();
  });

  it('reads what one person watched, where they stopped, what they kept and how they rated it', async () => {
    const { reader } = aJellyfinReader();
    const pat = userOf(await reader.users(), PAT);
    const states = await reader.userStates(pat);
    const heat = states.find((state) => state.itemId === 'item-heat');
    const detail = states.find((state) => state.itemId === 'item-wire-102');
    const wire = states.find((state) => state.itemId === 'item-wire');

    expect(heat).toEqual({
      itemId: 'item-heat',
      isPlayed: true,
      playCount: 3,
      lastPlayedAt: new Date('2026-03-04T21:00:00.000Z'),
      positionSeconds: 0,
      isFavourite: true,
      rating: 9,
    });
    expect(detail).toMatchObject({ isPlayed: false, positionSeconds: 1200 });
    expect(wire).toMatchObject({ isFavourite: true, rating: 10 });
    expect(await reader.plays(pat)).toEqual([]);
    expect(await reader.favouriteArtists(pat)).toEqual([
      { name: 'Massive Attack', musicBrainzId: '10adbe5e-a2c0-4bf3-8249-2b4cbf6e6ca8' },
    ]);
  });

  it('reads the box sets with what they hold', async () => {
    const { reader } = aJellyfinReader();

    expect(await reader.collections()).toEqual([
      {
        id: 'boxset-1',
        name: 'Heat Collection',
        description: 'Heists in LA.',
        itemIds: ['item-heat', 'item-wire'],
      },
    ]);
  });

  it('gives each playlist to the person who can see it and is not merely shared it', async () => {
    const { reader } = aJellyfinReader();
    const users = await reader.users();
    const playlists = await reader.playlists([userOf(users, PAT), userOf(users, SAM)]);

    expect([...playlists.entries()]).toEqual([
      [
        PAT,
        [
          {
            id: 'playlist-1',
            name: 'Sunday',
            isShared: true,
            itemIds: ['item-wire-101', 'item-heat'],
          },
        ],
      ],
    ]);
  });

  it('reads intro and credits segments, leaving out what Valence has no kind for', async () => {
    const { reader } = aJellyfinReader();
    const [, shows] = await reader.libraries();

    if (shows === undefined) {
      throw new Error('no shows');
    }

    const episode = itemOf(await reader.items(shows), 'item-wire-101');

    expect(await reader.markers(episode)).toEqual([
      { kind: 'intro', startSeconds: 30, endSeconds: 90 },
      { kind: 'credits', startSeconds: 3500, endSeconds: 3720 },
    ]);
    expect(await reader.markers({ ...episode, kind: 'track' })).toEqual([]);
  });

  it('reads a picture only where somebody has one', async () => {
    const { reader } = aJellyfinReader();
    const users = await reader.users();

    expect(await reader.avatar(userOf(users, PAT))).toEqual({
      body: new TextEncoder().encode('picture'),
      contentType: 'image/png',
    });
    expect(await reader.avatar(userOf(users, SAM))).toBeNull();
  });

  it('only ever reads', async () => {
    const { reader, calls } = aJellyfinReader();
    const users = await reader.users();

    for (const library of await reader.libraries()) {
      await reader.items(library);
    }

    await reader.userStates(userOf(users, PAT));
    await reader.collections();
    await reader.playlists(users);

    expect(calls.length).toBeGreaterThan(10);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
  });
});

describe('createMediaBrowserReader, reading Jellyfin 10.8', () => {
  it('asks through the user paths 10.8 has, and reads its own older rating scale', async () => {
    const { reader, calls } = aJellyfinReader(
      'jellyfin-legacy-public-info.json',
      'jellyfin-legacy-parental-ratings.json',
    );
    const users = await reader.users();
    const [films] = await reader.libraries();

    if (films === undefined) {
      throw new Error('no films');
    }

    await reader.items(films);
    await reader.userStates(userOf(users, PAT));

    expect(userOf(users, SAM).ceiling).toEqual({ maximumAge: 18, allowsUnrated: false });
    expect(userOf(users, PAT).avatarUrl).toBe(`/Users/${PAT}/Images/Primary?tag=tag-pat`);
    expect(calls.some((call) => call.url.pathname === `/Users/${PAT}/Items`)).toBe(true);
    expect(calls.some((call) => call.url.pathname === '/Items')).toBe(false);
  });

  it('reads intro timestamps from the Intro Skipper plugin, in seconds', async () => {
    const { reader } = aJellyfinReader(
      'jellyfin-legacy-public-info.json',
      'jellyfin-legacy-parental-ratings.json',
    );
    const [, shows] = await reader.libraries();

    if (shows === undefined) {
      throw new Error('no shows');
    }

    const episodes = await reader.items(shows);

    expect(await reader.markers(itemOf(episodes, 'item-wire-101'))).toEqual([
      { kind: 'intro', startSeconds: 31.5, endSeconds: 91 },
    ]);
    expect(await reader.markers(itemOf(episodes, 'item-wire-102'))).toEqual([]);
  });

  it('stops asking the plugin once it is plainly not installed', async () => {
    const { reader, calls } = aJellyfinReader(
      'jellyfin-legacy-public-info.json',
      'jellyfin-legacy-parental-ratings.json',
    );
    const [, shows] = await reader.libraries();

    if (shows === undefined) {
      throw new Error('no shows');
    }

    const detail = itemOf(await reader.items(shows), 'item-wire-102');

    for (let time = 0; time < 8; time += 1) {
      await reader.markers(detail);
    }

    expect(calls.filter((call) => call.url.pathname.includes('IntroTimestamps')).length).toBe(10);
  });
});

describe('createMediaBrowserReader, reading Emby', () => {
  /**
   * What an Emby server says to the importer.
   *
   * @param asked - The request.
   * @returns The answer.
   */
  const anEmby = ({ url }: FakeAsked): FakeAnswer | null => {
    const path = url.pathname;

    if (path === '/emby/System/Info/Public' || path === '/emby/System/Info') {
      return fixture('emby-public-info.json');
    }

    if (path === '/emby/Users/Query') {
      return fixture('emby-users-query.json');
    }

    if (path === '/emby/Library/VirtualFolders/Query') {
      return fixture('emby-folders-query.json');
    }

    if (path === '/emby/Localization/ParentalRatings') {
      return fixture('emby-parental-ratings.json');
    }

    if (path === '/emby/Users/1001/Items') {
      return fixture(
        url.searchParams.get('ParentId') === '3' ? 'emby-movies.json' : 'jellyfin-empty.json',
      );
    }

    if (path === '/emby/Users/1001/Items/501') {
      return fixture('emby-item-chapters.json');
    }

    return null;
  };

  it('sends its key the Emby way, under /emby, and reads users and libraries through their queries', async () => {
    const { fetch, calls } = aFakeSourceFetch(anEmby);
    const reader = createSourceReader(
      { kind: 'emby', url: 'http://192.168.1.11:8096', token: 'emby-key', clientId: 'c' },
      fetch,
      REGIONS,
    );

    await expect(reader.identify()).resolves.toMatchObject({ kind: 'emby', name: 'Lounge' });

    const users = await reader.users();
    const [movies] = await reader.libraries();

    if (movies === undefined) {
      throw new Error('no movies');
    }

    const [alien] = await reader.items(movies);

    if (alien === undefined) {
      throw new Error('no film');
    }

    expect(userOf(users, '1002')).toMatchObject({
      libraryAccess: { kind: 'only', libraryIds: ['3'] },
      ceiling: { maximumAge: 8, allowsUnrated: true },
    });
    expect(userOf(users, '1001').avatarUrl).toBe('/emby/Users/1001/Images/Primary?tag=abc');
    expect(movies.locations).toEqual(['D:\\Media\\Movies']);
    expect(alien.ids.tmdb).toBe('348');
    expect(await reader.markers(alien)).toEqual([
      { kind: 'intro', startSeconds: 20, endSeconds: 80 },
      { kind: 'credits', startSeconds: 6700, endSeconds: 7002 },
    ]);
    expect(calls.every((call) => call.headers['X-Emby-Token'] === 'emby-key')).toBe(true);
    expect(calls.every((call) => call.method === 'GET')).toBe(true);
  });

  it('refuses a Jellyfin server chosen as Emby', async () => {
    const { fetch } = aFakeSourceFetch(() => fixture('jellyfin-public-info.json'));
    const reader = createSourceReader(
      { kind: 'emby', url: 'http://x', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );

    await expect(reader.identify()).rejects.toBeInstanceOf(SourceFailure);
  });

  it('falls back to the plain lists where the queries are not there', async () => {
    const { fetch } = aFakeSourceFetch(({ url }) => {
      if (url.pathname.endsWith('/Query')) {
        return null;
      }

      if (url.pathname === '/emby/Users') {
        return { body: readFixture('emby-users.json') };
      }

      if (url.pathname === '/emby/Library/VirtualFolders') {
        return { body: readFixture('emby-folders.json') };
      }

      return anEmby({ method: 'GET', url, headers: {} });
    });
    const reader = createSourceReader(
      { kind: 'emby', url: 'http://x', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );

    expect((await reader.users()).map((user) => user.name)).toEqual(['Robin', 'Kit']);
  });
});

describe('createMediaBrowserReader, reading a server that says as little as it may', () => {
  /**
   * An answer of some JSON.
   *
   * @param body - What to answer.
   * @returns The answer.
   */
  const json = (body: object): FakeAnswer => ({ body: JSON.stringify(body) });

  /**
   * A Jellyfin too old to say its version, answering with only the fields it must.
   *
   * @param asked - The request.
   * @returns The answer.
   */
  const aSparseJellyfin = ({ url }: FakeAsked): FakeAnswer | null => {
    const path = url.pathname;
    const query = url.searchParams;
    const types = query.get('IncludeItemTypes');
    const filter = query.get('Filters');

    if (path === '/System/Info/Public' || path === '/System/Info') {
      return json({ ProductName: 'Jellyfin Server' });
    }

    if (path === '/Users') {
      return json([
        { Id: 'quiet', Policy: { MaxParentalRating: 10, BlockedMediaFolders: ['folder-guid'] } },
        { Id: 'other', Policy: { MaxParentalRating: 10, EnableAllFolders: true } },
      ]);
    }

    if (path === '/Library/VirtualFolders') {
      return json([{ Guid: 'folder-guid', CollectionType: 'movies' }, { Name: 'Loose' }, {}]);
    }

    if (/^\/Users\/[^/]+\/Items$/.test(path)) {
      if (query.get('ParentId') === 'folder-guid') {
        return json({
          Items: [
            { Id: 'film', Type: 'Movie' },
            { Id: 'episode', Type: 'Episode' },
            { Id: 'song', Type: 'Audio' },
            { Id: 'odd', Type: 'Photo' },
          ],
        });
      }

      if (query.get('ParentId') === 'box') {
        return json({ Items: [{ Id: 'film', Type: 'Movie' }] });
      }

      if (types === 'BoxSet') {
        return json({ Items: [{ Id: 'box', Type: 'BoxSet' }] });
      }

      if (types === 'Playlist') {
        return json({ Items: [{ Id: 'list', Type: 'Playlist' }] });
      }

      if (types === 'MusicArtist') {
        return json({ Items: [{ Id: 'artist', Type: 'MusicArtist' }] });
      }

      if (filter === 'IsPlayed') {
        return json({
          Items: [
            { Id: 'film', Type: 'Movie', UserData: {} },
            { Id: 'episode', Type: 'Episode', UserData: null },
          ],
        });
      }

      return json({ Items: [] });
    }

    if (path === '/Playlists/list/Items') {
      return json({ Items: [{ Id: 'song', Type: 'Audio' }] });
    }

    return null;
  };

  const aSparseReader = () => {
    const { fetch } = aFakeSourceFetch(aSparseJellyfin);

    return createSourceReader(
      { kind: 'jellyfin', url: 'http://quiet', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );
  };

  it('names the server for its kind and leaves its id and version empty', async () => {
    await expect(aSparseReader().identify()).resolves.toEqual({
      kind: 'jellyfin',
      serverId: '',
      name: 'Jellyfin',
      version: '0',
    });
  });

  it('names people by their id, and reads a ceiling with no rating table to read it by', async () => {
    const reader = aSparseReader();
    const users = await reader.users();

    expect(userOf(users, 'quiet')).toMatchObject({
      name: 'quiet',
      username: null,
      isAdministrator: false,
      libraryAccess: { kind: 'only', libraryIds: ['Loose', ''] },
      ceiling: { allowsUnrated: true },
      avatarUrl: null,
    });
    expect(userOf(users, 'other').libraryAccess).toEqual({ kind: 'all' });
    expect(await reader.users()).toEqual(users);
  });

  it('names a library by its id, with no kind and nowhere on disk', async () => {
    expect(await aSparseReader().libraries()).toEqual([
      { id: 'folder-guid', name: 'folder-guid', kind: 'movies', locations: [] },
      { id: 'Loose', name: 'Loose', kind: null, locations: [] },
      { id: '', name: '', kind: null, locations: [] },
    ]);
  });

  it('reads items with nothing but their ids and types', async () => {
    const reader = aSparseReader();
    const [library] = await reader.libraries();

    if (library === undefined) {
      throw new Error('no library');
    }

    const items = await reader.items(library);

    expect(items.map((item) => [item.id, item.kind, item.title])).toEqual([
      ['film', 'movie', ''],
      ['episode', 'episode', ''],
      ['song', 'track', ''],
      ['odd', 'other', ''],
    ]);
    expect(itemOf(items, 'episode')).toMatchObject({ seasonNumber: null, episodeNumber: null });
    expect(itemOf(items, 'song')).toMatchObject({ discNumber: null, trackNumber: null });
    expect(itemOf(items, 'film')).toMatchObject({ durationSeconds: null, year: null });
    expect(await reader.items({ ...library, kind: null })).toEqual([]);
  });

  it('reads what somebody watched with no more than that it was seen, skipping what has no record', async () => {
    const reader = aSparseReader();
    const [quiet] = await reader.users();

    if (quiet === undefined) {
      throw new Error('nobody');
    }

    expect(await reader.userStates(quiet)).toEqual([
      {
        itemId: 'film',
        isPlayed: false,
        playCount: 0,
        lastPlayedAt: null,
        positionSeconds: 0,
        isFavourite: false,
        rating: null,
      },
    ]);
    expect(await reader.favouriteArtists(quiet)).toEqual([{ name: '', musicBrainzId: null }]);
    expect(await reader.plays(quiet)).toEqual([]);
  });

  it('names a box set and a playlist by their ids, giving a playlist two people see to the first', async () => {
    const reader = aSparseReader();
    const users = await reader.users();

    expect(await reader.collections()).toEqual([
      { id: 'box', name: 'box', description: null, itemIds: ['film'] },
    ]);
    expect(await reader.playlists(users)).toEqual(
      new Map([['quiet', [{ id: 'list', name: 'list', isShared: true, itemIds: ['song'] }]]]),
    );
  });

  it('finds no markers on a film it has no plugin for, nor on an episode the plugin does not know', async () => {
    const reader = aSparseReader();
    const [library] = await reader.libraries();
    const items = library === undefined ? [] : await reader.items(library);

    expect(await reader.markers(itemOf(items, 'film'))).toEqual([]);
    expect(await reader.markers(itemOf(items, 'episode'))).toEqual([]);
    expect(await reader.markers(itemOf(items, 'song'))).toEqual([]);
  });

  it('says there is nobody on a server with no people', async () => {
    const { fetch } = aFakeSourceFetch(({ url }) =>
      url.pathname === '/Users' ? json([]) : aSparseJellyfin({ method: 'GET', url, headers: {} }),
    );
    const reader = createSourceReader(
      { kind: 'jellyfin', url: 'http://quiet', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );

    await expect(reader.collections()).rejects.toBeInstanceOf(SourceFailure);
  });

  it('names an Emby by its kind, and finds no markers where it says nothing of an item', async () => {
    const { fetch } = aFakeSourceFetch(({ url }) => {
      if (url.pathname === '/emby/System/Info/Public' || url.pathname === '/emby/System/Info') {
        return json({});
      }

      if (url.pathname === '/emby/Users') {
        return json([{ Id: 'admin', Policy: { IsAdministrator: true } }]);
      }

      if (url.pathname === '/emby/Users/admin/Items/chaptered') {
        return json({ Id: 'chaptered', Type: 'Movie', Chapters: [{ StartPositionTicks: 0 }] });
      }

      return null;
    });
    const reader = createSourceReader(
      { kind: 'emby', url: 'http://lounge', token: 'k', clientId: 'c' },
      fetch,
      REGIONS,
    );
    const film: SourceItem = {
      id: 'unknown',
      kind: 'movie',
      libraryId: null,
      title: 'Film',
      year: null,
      path: null,
      ids: NO_IDS,
      seriesId: null,
      seasonNumber: null,
      episodeNumber: null,
      albumId: null,
      discNumber: null,
      trackNumber: null,
      durationSeconds: null,
      addedAt: null,
    };

    await expect(reader.identify()).resolves.toMatchObject({ name: 'Emby', version: '0' });
    expect(await reader.markers(film)).toEqual([]);
    expect(await reader.markers({ ...film, id: 'chaptered', durationSeconds: 100 })).toEqual([]);
  });
});
