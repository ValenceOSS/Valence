import { describe, expect, it } from 'vitest';
import { book } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createDatabaseFavouriteService } from './createDatabaseFavouriteService';

const STARTING_POSTGRES_MS = 60_000;

describe('createDatabaseFavouriteService', { timeout: STARTING_POSTGRES_MS }, () => {
  it('keeps something once however often it is kept', async () => {
    const { db } = await aHousehold();
    const favourites = createDatabaseFavouriteService(db);

    await favourites.keep('pat', 'film');
    await favourites.keep('pat', 'film');

    const kept = await favourites.list('pat');

    expect(kept.map((one) => one.mediaId)).toEqual(['film']);
  });

  it('keeps a book once, beside the films kept', async () => {
    const { db } = await aHousehold();
    const favourites = createDatabaseFavouriteService(db);

    await db.insert(book).values({
      id: 'book',
      libraryId: 'films',
      path: '/films/book.epub',
      title: 'A Book',
      layout: 'reflow',
      direction: 'leftToRight',
    });
    await favourites.keep('pat', 'film');
    await favourites.keepBook('pat', 'book');
    await favourites.keepBook('pat', 'book');

    const books = await favourites.listBooks('pat');

    expect(books.map((one) => one.bookId)).toEqual(['book']);
    await expect(favourites.list('pat')).resolves.toHaveLength(1);
  });
});
