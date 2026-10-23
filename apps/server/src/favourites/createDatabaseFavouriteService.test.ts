import { describe, expect, it } from 'vitest';
import { book, favourite, mediaItem } from '#dialect/Schema';
import { aMediaItemRow } from '@ValenceServer/testing/aMediaItemRow';
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

  it('lists everything kept, not only the latest five hundred', async () => {
    const { db } = await aHousehold();
    const favourites = createDatabaseFavouriteService(db);
    const ids = Array.from({ length: 600 }, (_, at) => `kept-${at.toString()}`);

    await db.insert(mediaItem).values(ids.map((id) => aMediaItemRow(id, 'films')));
    await db.insert(favourite).values(
      ids.map((id, at) => ({
        id,
        profileId: 'pat',
        mediaItemId: id,
        keptAt: new Date(Date.UTC(2026, 0, 1) + at * 1000),
      })),
    );

    await expect(favourites.list('pat')).resolves.toHaveLength(600);
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
