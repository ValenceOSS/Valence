import { describe, expect, it } from 'vitest';
import { book, library, mediaItem, musicAlbum, musicArtist, musicTrack } from '#dialect/Schema';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { countTelemetryLibrary } from './countTelemetryLibrary';

const STARTING_POSTGRES_MS = 60_000;

describe('countTelemetryLibrary', { timeout: STARTING_POSTGRES_MS }, () => {
  it('counts nothing in an empty server', async () => {
    await expect(countTelemetryLibrary(await aMigratedDatabase())).resolves.toEqual({
      films: 0,
      episodes: 0,
      tracks: 0,
      books: 0,
    });
  });

  it('counts the films, episodes, songs and books of the server’s own libraries', async () => {
    const db = await aMigratedDatabase();

    await db.insert(library).values([
      { id: 'films', name: 'Films', kind: 'movies', path: '/films' },
      { id: 'shows', name: 'Shows', kind: 'shows', path: '/shows' },
      { id: 'anime', name: 'Anime', kind: 'anime', path: '/anime' },
      { id: 'music', name: 'Music', kind: 'music', path: '/music' },
      { id: 'books', name: 'Books', kind: 'books', path: '/books' },
    ]);
    await db
      .insert(mediaItem)
      .values([
        aMediaItemRow('film', 'films'),
        { ...aMediaItemRow('trailer', 'films'), extraKind: 'trailer', parentId: 'film' },
        { ...aMediaItemRow('gone', 'films'), missingSince: new Date() },
        { ...aMediaItemRow('pilot', 'shows'), episodeNumber: 1 },
        { ...aMediaItemRow('second', 'shows'), episodeNumber: 2 },
        { ...aMediaItemRow('anime-film', 'anime') },
        { ...aMediaItemRow('anime-episode', 'anime'), episodeNumber: 1 },
        aMediaItemRow('song', 'music'),
      ]);
    await db.insert(musicArtist).values({
      id: 'artist',
      libraryId: 'music',
      name: 'Artist',
      nameKey: 'artist',
      sortName: 'Artist',
    });
    await db.insert(musicAlbum).values({
      id: 'album',
      libraryId: 'music',
      artistId: 'artist',
      title: 'Album',
      titleKey: 'album',
    });
    await db.insert(musicTrack).values({ mediaItemId: 'song', albumId: 'album', codec: 'flac' });
    await db.insert(book).values({
      id: 'book',
      libraryId: 'books',
      path: '/books/book.epub',
      title: 'A Book',
      layout: 'reflow',
      direction: 'leftToRight',
    });

    await expect(countTelemetryLibrary(db)).resolves.toEqual({
      films: 2,
      episodes: 3,
      tracks: 1,
      books: 1,
    });
  });
});
