import { describe, expect, it } from 'vitest';
import { aMigratedDatabase } from '#dialect/aMigratedDatabase';
import { book, bookChapter, library, mediaItem, series } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
import { createCatalogueReader } from './createCatalogueReader';
import { SHARED_ELSEWHERE } from './SHARED_ELSEWHERE';

const STARTING_THE_DATABASE_MS = 60_000;

describe('createCatalogueReader', () => {
  it(
    'reads a library’s titles and their programmes, saying only that it has their files',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values({ id: 'shows', name: 'Shows', kind: 'shows', path: '/s' });
      await db
        .insert(series)
        .values({ id: 'show', libraryId: 'shows', key: 'show', title: 'Show' });
      await db.insert(mediaItem).values({
        ...aMediaItemRow('episode', 'shows'),
        seriesId: 'show',
        posterUrl: '/posters/episode.jpg',
      });

      const page = await createCatalogueReader(db)('shows', null);

      expect(page?.series.map((one) => one.id)).toEqual(['show']);
      expect(page?.mediaItems[0]).toMatchObject({
        id: 'episode',
        path: SHARED_ELSEWHERE,
        posterUrl: SHARED_ELSEWHERE,
        backdropUrl: null,
      });
      expect(page?.next).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'reads a page after the id the last one ended on',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values({ id: 'films', name: 'Films', kind: 'movies', path: '/f' });
      await db.insert(mediaItem).values([aMediaItemRow('a', 'films'), aMediaItemRow('b', 'films')]);

      expect(
        (await createCatalogueReader(db)('films', 'a'))?.mediaItems.map((one) => one.id),
      ).toEqual(['b']);
    },
    STARTING_THE_DATABASE_MS,
  );

  it(
    'reads a book library’s books and chapters, and nothing for a library there is not',
    async () => {
      const db = await aMigratedDatabase();

      await db.insert(library).values({ id: 'books', name: 'Books', kind: 'books', path: '/b' });
      await db.insert(book).values({
        id: 'dune',
        libraryId: 'books',
        path: '/b/dune.epub',
        title: 'Dune',
        layout: 'reflow',
        direction: 'leftToRight',
      });
      await db.insert(bookChapter).values({
        id: 'one',
        bookId: 'dune',
        path: '/b/dune.epub',
        number: 1,
        title: 'One',
        format: 'epub',
        sizeBytes: 1,
        modifiedAtMs: 0,
      });

      const read = createCatalogueReader(db);
      const page = await read('books', null);

      expect(page?.books[0]).toMatchObject({
        id: 'dune',
        path: SHARED_ELSEWHERE,
        posterUrl: null,
      });
      expect(page?.chapters[0]).toMatchObject({ id: 'one', path: SHARED_ELSEWHERE });
      expect(page?.mediaItems).toEqual([]);
      expect(await read('nowhere', null)).toBeNull();
    },
    STARTING_THE_DATABASE_MS,
  );
});
