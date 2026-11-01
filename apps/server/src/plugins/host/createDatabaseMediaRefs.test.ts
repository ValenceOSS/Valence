import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  book,
  bookChapter,
  hidden,
  library,
  libraryBlock,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
  user,
  viewerProfile,
} from '#dialect/Schema';
import { createDatabaseMediaRefs } from './createDatabaseMediaRefs';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const STARTING_POSTGRES_MS = 60_000;

/**
 * An item as the scan would store it.
 *
 * @param id - The item.
 * @param libraryId - The library it is in.
 * @param title - What it is called.
 * @returns The row.
 */
const anItem = (id: string, libraryId: string, title: string): typeof mediaItem.$inferInsert => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}`,
  title,
  sizeBytes: 1,
  modifiedAtMs: 1,
  container: 'mkv',
  durationSeconds: 60,
  videoCodec: 'h264',
  videoRange: 'sdr',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

/**
 * The library a plugin is shown, over a fresh database holding two films, one of them with a second
 * version and a trailer, an episode of a series, one song credited to two artists, an ebook and an
 * audiobook.
 *
 * @returns How a plugin searches it.
 */
const aLibrary = async () => {
  const db = await aMigratedDatabase();

  await db.insert(library).values([
    { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
    { id: 'music', name: 'Music', kind: 'music', path: '/music' },
    { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
    { id: 'books', name: 'Books', kind: 'books', path: '/books' },
  ]);
  await db.insert(series).values({
    id: 'frieren',
    libraryId: 'shows',
    key: 'frieren',
    title: 'Frieren',
    externalId: '209867',
    anilistId: 154_587,
    malId: 52_991,
  });
  await db.insert(mediaItem).values([
    { ...anItem('arrival', 'films', 'Arrival'), externalId: '329865', imdbId: 'tt2543164' },
    { ...anItem('arrival-4k', 'films', 'Arrival'), parentId: 'arrival', versionLabel: '4K' },
    {
      ...anItem('arrival-trailer', 'films', 'Arrival'),
      parentId: 'arrival',
      extraKind: 'trailer',
    },
    anItem('percent', 'films', '100% Wolf'),
    {
      ...anItem('first', 'shows', 'The Journey’s End'),
      seriesId: 'frieren',
      seasonNumber: 1,
      episodeNumber: 1,
    },
    anItem('song', 'music', 'Running Up That Hill'),
    anItem('mother', 'music', 'Mother Stands for Comfort'),
  ]);
  await db.insert(musicArtist).values([
    {
      id: 'kate',
      libraryId: 'music',
      name: 'Kate Bush',
      nameKey: 'kate bush',
      sortName: 'Bush, Kate',
      musicbrainzId: '4b585938-f271-45e2-b19a-91c634b5e396',
    },
    {
      id: 'peter',
      libraryId: 'music',
      name: 'Peter Gabriel',
      nameKey: 'peter gabriel',
      sortName: 'Gabriel, Peter',
    },
  ]);
  await db.insert(musicAlbum).values({
    id: 'hounds',
    libraryId: 'music',
    artistId: 'kate',
    title: 'Hounds of Love',
    titleKey: 'hounds of love',
    musicbrainzId: 'f8a5a8f2-1b57-4bb0-a4f1-6f6d8d3b0c6b',
  });
  await db.insert(musicTrack).values([
    { mediaItemId: 'mother', albumId: 'hounds', codec: 'flac', discNumber: 1, trackNumber: 2 },
    { mediaItemId: 'song', albumId: 'hounds', codec: 'flac', discNumber: 1, trackNumber: 1 },
  ]);
  await db.insert(book).values([
    {
      id: 'piranesi',
      libraryId: 'books',
      path: '/books/piranesi',
      title: 'Piranesi',
      layout: 'reflow',
      direction: 'leftToRight',
    },
    {
      id: 'dune',
      libraryId: 'books',
      path: '/books/dune',
      title: 'Dune',
      layout: 'audio',
      direction: 'leftToRight',
      year: 1965,
    },
  ]);
  await db.insert(bookChapter).values([
    {
      id: 'piranesi-1',
      bookId: 'piranesi',
      path: '/books/piranesi/piranesi.epub',
      number: 1,
      title: 'Piranesi',
      format: 'epub',
      sizeBytes: 1,
      modifiedAtMs: 1,
    },
    {
      id: 'dune-1',
      bookId: 'dune',
      path: '/books/dune/1.m4b',
      number: 1,
      title: 'Part one',
      format: 'm4b',
      durationSeconds: 3600,
      sizeBytes: 1,
      modifiedAtMs: 1,
    },
    {
      id: 'dune-2',
      bookId: 'dune',
      path: '/books/dune/2.m4b',
      number: 2,
      title: 'Part two',
      format: 'm4b',
      durationSeconds: 1800,
      sizeBytes: 1,
      modifiedAtMs: 1,
    },
  ]);
  await db.insert(musicTrackArtist).values([
    { mediaItemId: 'song', artistId: 'peter', position: 1 },
    { mediaItemId: 'song', artistId: 'kate', position: 0 },
    { mediaItemId: 'mother', artistId: 'kate', position: 0 },
  ]);
  await db.insert(user).values({ id: 'kid', name: 'Kid', email: 'kid@example.com' });
  await db.insert(libraryBlock).values([
    { userId: 'kid', libraryId: 'films' },
    { userId: 'kid', libraryId: 'shows' },
    { userId: 'kid', libraryId: 'music' },
  ]);

  await db.insert(user).values({ id: 'adult', name: 'Adult', email: 'adult@example.com' });
  await db
    .insert(viewerProfile)
    .values({ id: 'grown', userId: 'adult', name: 'Grown', colour: 'blue' });
  await db.insert(hidden).values([
    { id: 'hid-film', profileId: 'grown', mediaItemId: 'arrival' },
    { id: 'hid-series', profileId: 'grown', seriesId: 'frieren' },
  ]);

  return createDatabaseMediaRefs(db);
};

const KID: Viewer = { kind: 'account', accountId: 'kid', profileId: null, isAdministrator: false };

describe('createDatabaseMediaRefs', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads for a viewer only what their account may reach, and everything for the server', async () => {
    const refs = await aLibrary();

    await expect(refs.get('arrival', KID)).resolves.toBeNull();
    await expect(refs.get('frieren', KID)).resolves.toBeNull();
    await expect(refs.get('piranesi', KID)).resolves.toMatchObject({ kind: 'book' });
    await expect(refs.search('arri', ['film'], KID)).resolves.toEqual([]);
    await expect(refs.findByExternalId('anilist', '154587', KID)).resolves.toEqual([]);
    await expect(refs.episodes('frieren', KID)).resolves.toEqual([]);
    await expect(refs.sees({ kind: 'artist', id: 'kate' }, KID)).resolves.toBe(false);
    await expect(refs.sees({ kind: 'title', id: 'arrival' }, KID)).resolves.toBe(false);
    await expect(refs.sees({ kind: 'artist', id: 'kate' }, asTheServer)).resolves.toBe(true);
    await expect(refs.sees({ kind: 'series', id: 'frieren' }, asTheServer)).resolves.toBe(true);
    await expect(refs.get('arrival', asTheServer)).resolves.toMatchObject({ id: 'arrival' });
  });

  it('still finds what somebody hid from their own lists', async () => {
    const refs = await aLibrary();
    const grown: Viewer = {
      kind: 'account',
      accountId: 'adult',
      profileId: 'grown',
      isAdministrator: false,
    };

    await expect(refs.get('arrival', grown)).resolves.toMatchObject({ id: 'arrival' });
    await expect(refs.get('frieren', grown)).resolves.toMatchObject({ kind: 'series' });
    await expect(refs.episodes('frieren', grown)).resolves.toMatchObject([{ id: 'first' }]);
    await expect(refs.search('arri', ['film'], grown)).resolves.toMatchObject([{ id: 'arrival' }]);
  });

  it('reads nothing from a library still locked to the viewer, books included', async () => {
    const refs = await aLibrary();
    const locked: Viewer = {
      kind: 'account',
      accountId: 'adult',
      profileId: 'grown',
      isAdministrator: false,
      lockedLibraries: ['films', 'books'],
    };

    await expect(refs.get('arrival', locked)).resolves.toBeNull();
    await expect(refs.get('piranesi', locked)).resolves.toBeNull();
    await expect(refs.search('dune', ['book'], locked)).resolves.toEqual([]);
    await expect(refs.sees({ kind: 'book', id: 'piranesi' }, locked)).resolves.toBe(false);
    await expect(refs.sees({ kind: 'book', id: 'piranesi' }, KID)).resolves.toBe(true);
    await expect(refs.get('song', locked)).resolves.toMatchObject({ kind: 'track' });
  });

  it('lists each kind a page at a time, in title order, and only what the viewer may reach', async () => {
    const refs = await aLibrary();
    const ids: string[] = [];
    let after: string | null = null;

    do {
      const page = await refs.list({ kind: 'film', after, limit: 1 }, asTheServer);

      ids.push(...page.items.map((ref) => ref.id));
      after = page.next;
    } while (after !== null);

    expect(ids).toEqual(['percent', 'arrival']);
    await expect(
      refs.list({ kind: 'artist', after: null, limit: 10 }, asTheServer),
    ).resolves.toMatchObject({ items: [{ id: 'kate' }, { id: 'peter' }], next: null });
    await expect(refs.list({ kind: 'track', after: null, limit: 10 }, KID)).resolves.toEqual({
      items: [],
      next: null,
    });
    await expect(refs.list({ kind: 'book', after: null, limit: 10 }, KID)).resolves.toMatchObject({
      items: [{ id: 'dune' }, { id: 'piranesi' }],
    });
  });

  it('refuses a page mark Valence did not give for that list', async () => {
    const refs = await aLibrary();
    const { next } = await refs.list({ kind: 'film', after: null, limit: 1 }, asTheServer);

    expect(next).not.toBeNull();
    await expect(
      refs.list({ kind: 'series', after: next ?? '', limit: 1 }, asTheServer),
    ).rejects.toThrow('page mark');
    await expect(
      refs.list({ kind: 'film', after: 'not-a-mark', limit: 1 }, asTheServer),
    ).rejects.toThrow('page mark');
  });

  it('reads what is in an album, an artist and a series, in their own order', async () => {
    const refs = await aLibrary();

    expect((await refs.children('hounds', asTheServer)).map((ref) => ref.id)).toEqual([
      'song',
      'mother',
    ]);
    await expect(refs.children('kate', asTheServer)).resolves.toMatchObject([
      { id: 'hounds', kind: 'album' },
    ]);
    await expect(refs.children('frieren', asTheServer)).resolves.toMatchObject([{ id: 'first' }]);
    await expect(refs.children('arrival', asTheServer)).resolves.toEqual([]);
    await expect(refs.children('hounds', KID)).resolves.toEqual([]);
    await expect(refs.children('kate', KID)).resolves.toEqual([]);
    await expect(refs.children('frieren', KID)).resolves.toEqual([]);
  });

  it('reads an artist by id, by name and by MusicBrainz id', async () => {
    const refs = await aLibrary();

    await expect(refs.get('kate', asTheServer)).resolves.toMatchObject({
      kind: 'artist',
      title: 'Kate Bush',
      externalIds: { musicbrainz: '4b585938-f271-45e2-b19a-91c634b5e396' },
    });
    await expect(refs.search('kate', ['artist'], asTheServer)).resolves.toMatchObject([
      { id: 'kate' },
    ]);
    await expect(
      refs.findByExternalId('musicbrainz', '4b585938-f271-45e2-b19a-91c634b5e396', asTheServer),
    ).resolves.toMatchObject([{ id: 'kate' }]);
    await expect(refs.get('kate', KID)).resolves.toBeNull();
  });

  it('reads the details of several things at once, in the order asked, leaving out what it cannot', async () => {
    const refs = await aLibrary();
    const found = await refs.details(['song', 'hounds', 'nothing', 'dune', 'arrival'], asTheServer);

    expect(found.map((each) => each.id)).toEqual(['song', 'hounds', 'dune', 'arrival']);
    expect(found[0]).toMatchObject({
      kind: 'track',
      albumId: 'hounds',
      artistId: 'kate',
      discNumber: 1,
      trackNumber: 1,
      file: { container: 'mkv', sizeBytes: 1 },
    });
    expect(found[1]).toMatchObject({ kind: 'album', artistId: 'kate', genres: [], file: null });
    expect(found[2]).toMatchObject({ kind: 'book', durationSeconds: 5400, file: null });
    expect(found[3]).toMatchObject({
      kind: 'film',
      albumId: null,
      externalIds: { tmdb: '329865' },
    });
    await expect(refs.details(['song', 'arrival', 'dune'], KID)).resolves.toMatchObject([
      { id: 'dune' },
    ]);
    await expect(refs.details([], asTheServer)).resolves.toEqual([]);
  });

  it('pages past things of the same name without skipping or repeating any', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/films' });
    await db
      .insert(mediaItem)
      .values([
        anItem('c', 'films', 'Same'),
        anItem('a', 'films', 'Same'),
        anItem('b', 'films', 'Same'),
      ]);

    const refs = createDatabaseMediaRefs(db);
    const ids: string[] = [];
    let after: string | null = null;

    do {
      const page = await refs.list({ kind: 'film', after, limit: 1 }, asTheServer);

      ids.push(...page.items.map((ref) => ref.id));
      after = page.next;
    } while (after !== null);

    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('lists, browses and details nothing from a library still locked to the viewer', async () => {
    const refs = await aLibrary();
    const locked: Viewer = {
      kind: 'account',
      accountId: 'adult',
      profileId: 'grown',
      isAdministrator: false,
      lockedLibraries: ['music', 'books'],
    };

    await expect(refs.list({ kind: 'artist', after: null, limit: 10 }, locked)).resolves.toEqual({
      items: [],
      next: null,
    });
    await expect(refs.list({ kind: 'book', after: null, limit: 10 }, locked)).resolves.toEqual({
      items: [],
      next: null,
    });
    await expect(refs.children('hounds', locked)).resolves.toEqual([]);
    await expect(refs.children('kate', locked)).resolves.toEqual([]);
    await expect(
      refs.details(['song', 'hounds', 'dune', 'arrival'], locked),
    ).resolves.toMatchObject([{ id: 'arrival' }]);
  });

  it('reads when a series or an artist was added, and an artist credited on a track holds its album', async () => {
    const refs = await aLibrary();

    const [show, singer] = await refs.details(['frieren', 'kate'], asTheServer);

    expect(show).toMatchObject({ kind: 'series', overview: null, file: null });
    expect(Date.parse(show?.addedAt ?? '')).not.toBeNaN();
    expect(singer).toMatchObject({ kind: 'artist', genres: [] });
    expect(Date.parse(singer?.addedAt ?? '')).not.toBeNaN();
    await expect(refs.children('peter', asTheServer)).resolves.toMatchObject([{ id: 'hounds' }]);
  });

  it('reads a film by its id, with the outside ids Valence knows it by', async () => {
    const refs = await aLibrary();

    await expect(refs.get('arrival', asTheServer)).resolves.toEqual({
      id: 'arrival',
      kind: 'film',
      title: 'Arrival',
      year: null,
      seriesId: null,
      seasonNumber: null,
      episodeNumber: null,
      durationSeconds: 60,
      artist: null,
      album: null,
      externalIds: { tmdb: '329865', imdb: 'tt2543164' },
    });
  });

  it('reads another version of a film as the film, and a trailer as nothing', async () => {
    const refs = await aLibrary();

    await expect(refs.get('arrival-4k', asTheServer)).resolves.toMatchObject({
      id: 'arrival',
      kind: 'film',
    });
    await expect(refs.get('arrival-trailer', asTheServer)).resolves.toBeNull();
  });

  it('reads an episode, and the series it belongs to by the id the episode gives', async () => {
    const refs = await aLibrary();
    const episode = await refs.get('first', asTheServer);

    expect(episode).toMatchObject({
      kind: 'episode',
      seriesId: 'frieren',
      seasonNumber: 1,
      episodeNumber: 1,
    });
    await expect(refs.get(episode?.seriesId ?? '', asTheServer)).resolves.toMatchObject({
      id: 'frieren',
      kind: 'series',
      title: 'Frieren',
      externalIds: { tmdb: '209867', anilist: '154587', mal: '52991' },
    });
  });

  it('reads a track with the artist credited first and the album it is on', async () => {
    const refs = await aLibrary();

    await expect(refs.get('song', asTheServer)).resolves.toMatchObject({
      kind: 'track',
      title: 'Running Up That Hill',
      artist: 'Kate Bush',
      album: 'Hounds of Love',
    });
  });

  it('reads an album with its artist', async () => {
    const refs = await aLibrary();

    await expect(refs.get('hounds', asTheServer)).resolves.toMatchObject({
      kind: 'album',
      title: 'Hounds of Love',
      artist: 'Kate Bush',
      album: null,
      externalIds: { musicbrainz: 'f8a5a8f2-1b57-4bb0-a4f1-6f6d8d3b0c6b' },
    });
  });

  it('reads a book, running as long as its audio together, and an ebook as not running at all', async () => {
    const refs = await aLibrary();

    await expect(refs.get('dune', asTheServer)).resolves.toMatchObject({
      kind: 'book',
      title: 'Dune',
      year: 1965,
      durationSeconds: 5400,
    });
    await expect(refs.get('piranesi', asTheServer)).resolves.toMatchObject({
      kind: 'book',
      durationSeconds: null,
    });
  });

  it('finds a book by part of its title', async () => {
    const refs = await aLibrary();

    expect((await refs.search('piran', ['book'], asTheServer)).map((ref) => ref.id)).toEqual([
      'piranesi',
    ]);
    expect((await refs.search('piran', [], asTheServer)).map((ref) => ref.id)).toEqual([
      'piranesi',
    ]);
  });

  it('reads nothing for an id the library does not hold', async () => {
    const refs = await aLibrary();

    await expect(refs.get('nowhere', asTheServer)).resolves.toBeNull();
  });

  it('gives a track found by searching its artist and album', async () => {
    const refs = await aLibrary();

    await expect(refs.search('running', ['track'], asTheServer)).resolves.toMatchObject([
      { id: 'song', artist: 'Kate Bush', album: 'Hounds of Love' },
    ]);
  });

  it('finds a film by part of its title whatever the case', async () => {
    const refs = await aLibrary();

    expect((await refs.search('ARRI', ['film'], asTheServer)).map((ref) => ref.id)).toEqual([
      'arrival',
    ]);
  });

  it('finds anime by its AniList or MyAnimeList id, and says both', async () => {
    const refs = await aLibrary();

    await expect(refs.findByExternalId('anilist', '154587', asTheServer)).resolves.toMatchObject([
      { id: 'frieren', externalIds: { tmdb: '209867', anilist: '154587', mal: '52991' } },
    ]);
    await expect(refs.findByExternalId('mal', '52991', asTheServer)).resolves.toHaveLength(1);
    await expect(refs.findByExternalId('mal', 'nope', asTheServer)).resolves.toEqual([]);
  });

  it('reads the characters a pattern would use as written', async () => {
    const refs = await aLibrary();

    expect((await refs.search('100%', ['film'], asTheServer)).map((ref) => ref.id)).toEqual([
      'percent',
    ]);
    await expect(refs.search('_rrival', ['film'], asTheServer)).resolves.toEqual([]);
  });

  it('finds a track by its title and artist whatever the case', async () => {
    const refs = await aLibrary();

    await expect(
      refs.findTrack(
        { title: 'running up that hill', artist: 'KATE BUSH', album: null, isrc: null },
        asTheServer,
      ),
    ).resolves.toMatchObject({
      id: 'song',
      kind: 'track',
      artist: 'Kate Bush',
      album: 'Hounds of Love',
    });
    await expect(
      refs.findTrack(
        { title: 'Running Up That Hill', artist: 'Kate', album: null, isrc: null },
        asTheServer,
      ),
    ).resolves.toBeNull();
  });
});
