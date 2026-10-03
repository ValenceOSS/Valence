import { describe, expect, it } from 'vitest';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { localIdOf } from './localIdOf';
import { localRowsOf } from './localRowsOf';
import { CataloguePageSchema } from './CataloguePageSchema';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

const HERE = 'library-here';

const NOTHING = {
  series: [],
  mediaItems: [],
  artists: [],
  albums: [],
  tracks: [],
  trackArtists: [],
  books: [],
  chapters: [],
  next: null,
};

const at = (route: string) => `linked://${FILMS}${route}`;

describe('localRowsOf', () => {
  it('makes a title’s id, library, references, path and artwork this server’s own', () => {
    const page = CataloguePageSchema.parse({
      ...NOTHING,
      series: [{ id: 'show', libraryId: 'theirs', key: 'show', title: 'Show' }],
      mediaItems: [
        {
          ...aMediaItemRow('episode', 'theirs'),
          seriesId: 'show',
          parentId: 'cut',
          posterUrl: 'x',
          backdropUrl: null,
        },
      ],
    });
    const rows = localRowsOf(page, FILMS, HERE);

    expect(rows.series[0]).toMatchObject({ id: localIdOf(FILMS, 'show'), libraryId: HERE });
    expect(rows.mediaItems[0]).toMatchObject({
      id: localIdOf(FILMS, 'episode'),
      libraryId: HERE,
      seriesId: localIdOf(FILMS, 'show'),
      parentId: localIdOf(FILMS, 'cut'),
      path: at('/api/media/episode'),
      posterUrl: at('/api/media/episode/image/poster'),
      backdropUrl: null,
    });
  });

  it('follows every reference between songs, albums and artists', () => {
    const page = CataloguePageSchema.parse({
      ...NOTHING,
      artists: [
        {
          id: 'artist',
          libraryId: 'theirs',
          name: 'A',
          nameKey: 'a',
          sortName: 'A',
          imagePath: 'x',
        },
      ],
      albums: [{ id: 'album', libraryId: 'theirs', artistId: 'artist', title: 'B', titleKey: 'b' }],
      tracks: [{ mediaItemId: 'song', albumId: 'album', codec: 'flac' }],
      trackArtists: [{ mediaItemId: 'song', artistId: 'artist', position: 0 }],
    });
    const rows = localRowsOf(page, FILMS, HERE);

    expect(rows.artists[0]?.imagePath).toBe(at('/api/music/artists/artist/image'));
    expect(rows.albums[0]).toMatchObject({
      artistId: localIdOf(FILMS, 'artist'),
      artworkPath: null,
    });
    expect(rows.tracks[0]).toMatchObject({
      mediaItemId: localIdOf(FILMS, 'song'),
      albumId: localIdOf(FILMS, 'album'),
    });
    expect(rows.trackArtists[0]?.artistId).toBe(localIdOf(FILMS, 'artist'));
  });

  it('reads a book’s cover and chapters from the server that has them', () => {
    const page = CataloguePageSchema.parse({
      ...NOTHING,
      books: [
        {
          id: 'dune',
          libraryId: 'theirs',
          path: 'x',
          title: 'Dune',
          layout: 'reflow',
          direction: 'leftToRight',
          posterUrl: 'x',
        },
      ],
      chapters: [
        {
          id: 'one',
          bookId: 'dune',
          path: 'x',
          number: 1,
          title: 'One',
          format: 'epub',
          sizeBytes: 1,
          modifiedAtMs: 0,
        },
      ],
    });
    const rows = localRowsOf(page, FILMS, HERE);

    expect(rows.books[0]).toMatchObject({
      path: at('/api/books/dune'),
      posterUrl: at('/api/books/dune/cover'),
    });
    expect(rows.chapters[0]).toMatchObject({
      bookId: localIdOf(FILMS, 'dune'),
      path: at('/api/books/dune/chapters/one'),
    });
  });
});
