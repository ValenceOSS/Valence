import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import {
  book,
  bookChapter,
  library,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
} from '#dialect/Schema';
import { createDatabaseMediaRefs } from './createDatabaseMediaRefs';

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
  ]);
  await db.insert(musicArtist).values([
    {
      id: 'kate',
      libraryId: 'music',
      name: 'Kate Bush',
      nameKey: 'kate bush',
      sortName: 'Bush, Kate',
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
  await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'hounds', codec: 'flac' });
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
  ]);

  return createDatabaseMediaRefs(db);
};

describe('createDatabaseMediaRefs', { timeout: STARTING_POSTGRES_MS }, () => {
  it('reads a film by its id, with the outside ids Valence knows it by', async () => {
    const refs = await aLibrary();

    await expect(refs.get('arrival')).resolves.toEqual({
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

    await expect(refs.get('arrival-4k')).resolves.toMatchObject({ id: 'arrival', kind: 'film' });
    await expect(refs.get('arrival-trailer')).resolves.toBeNull();
  });

  it('reads an episode, and the series it belongs to by the id the episode gives', async () => {
    const refs = await aLibrary();
    const episode = await refs.get('first');

    expect(episode).toMatchObject({
      kind: 'episode',
      seriesId: 'frieren',
      seasonNumber: 1,
      episodeNumber: 1,
    });
    await expect(refs.get(episode?.seriesId ?? '')).resolves.toMatchObject({
      id: 'frieren',
      kind: 'series',
      title: 'Frieren',
      externalIds: { tmdb: '209867' },
    });
  });

  it('reads a track with the artist credited first and the album it is on', async () => {
    const refs = await aLibrary();

    await expect(refs.get('song')).resolves.toMatchObject({
      kind: 'track',
      title: 'Running Up That Hill',
      artist: 'Kate Bush',
      album: 'Hounds of Love',
    });
  });

  it('reads an album with its artist', async () => {
    const refs = await aLibrary();

    await expect(refs.get('hounds')).resolves.toMatchObject({
      kind: 'album',
      title: 'Hounds of Love',
      artist: 'Kate Bush',
      album: null,
      externalIds: { musicbrainz: 'f8a5a8f2-1b57-4bb0-a4f1-6f6d8d3b0c6b' },
    });
  });

  it('reads a book, running as long as its audio together, and an ebook as not running at all', async () => {
    const refs = await aLibrary();

    await expect(refs.get('dune')).resolves.toMatchObject({
      kind: 'book',
      title: 'Dune',
      year: 1965,
      durationSeconds: 5400,
    });
    await expect(refs.get('piranesi')).resolves.toMatchObject({
      kind: 'book',
      durationSeconds: null,
    });
  });

  it('finds a book by part of its title', async () => {
    const refs = await aLibrary();

    expect((await refs.search('piran', ['book'])).map((ref) => ref.id)).toEqual(['piranesi']);
    expect((await refs.search('piran', [])).map((ref) => ref.id)).toEqual(['piranesi']);
  });

  it('reads nothing for an id the library does not hold', async () => {
    const refs = await aLibrary();

    await expect(refs.get('nowhere')).resolves.toBeNull();
  });

  it('gives a track found by searching its artist and album', async () => {
    const refs = await aLibrary();

    await expect(refs.search('running', ['track'])).resolves.toMatchObject([
      { id: 'song', artist: 'Kate Bush', album: 'Hounds of Love' },
    ]);
  });

  it('finds a film by part of its title whatever the case', async () => {
    const refs = await aLibrary();

    expect((await refs.search('ARRI', ['film'])).map((ref) => ref.id)).toEqual(['arrival']);
  });

  it('reads the characters a pattern would use as written', async () => {
    const refs = await aLibrary();

    expect((await refs.search('100%', ['film'])).map((ref) => ref.id)).toEqual(['percent']);
    await expect(refs.search('_rrival', ['film'])).resolves.toEqual([]);
  });

  it('finds a track by its title and artist whatever the case', async () => {
    const refs = await aLibrary();

    await expect(
      refs.findTrack({
        title: 'running up that hill',
        artist: 'KATE BUSH',
        album: null,
        isrc: null,
      }),
    ).resolves.toMatchObject({
      id: 'song',
      kind: 'track',
      artist: 'Kate Bush',
      album: 'Hounds of Love',
    });
    await expect(
      refs.findTrack({ title: 'Running Up That Hill', artist: 'Kate', album: null, isrc: null }),
    ).resolves.toBeNull();
  });
});
