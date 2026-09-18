import { describe, expect, it } from 'vitest';
import { createMemoryBookService } from './createMemoryBookService';
import type { Book, BookChapter } from '@ValenceContracts/schemas/Book';

const BOOK: Book = {
  id: 'b1',
  libraryId: 'l1',
  title: 'Emma',
  layout: 'reflow',
  direction: 'leftToRight',
  year: null,
  overview: null,
  genres: null,
  authors: null,
  rating: null,
  hasCover: true,
  chapterCount: 1,
  addedAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const CHAPTER: BookChapter = {
  id: 'c1',
  bookId: 'b1',
  number: 0,
  title: 'Emma',
  format: 'epub',
  pageCount: null,
  addedAt: '2026-09-18T00:00:00.000Z',
};

const shelf = () =>
  createMemoryBookService({
    books: [BOOK],
    chapters: [CHAPTER],
    documents: { 'c1:0': '<img src="{picture}"/>' },
  });

describe('createMemoryBookService', () => {
  it('lists the books in a library', async () => {
    expect(await shelf().list('l1')).toEqual([BOOK]);
    expect(await shelf().list('elsewhere')).toEqual([]);
  });

  it('reads a book with its chapters', async () => {
    expect(await shelf().read('b1')).toEqual({ book: BOOK, chapters: [CHAPTER] });
    expect(await shelf().read('nothing')).toBeNull();
  });

  it('writes the address it is given into a part', async () => {
    expect(await shelf().readDocument('c1', 0, (href) => `/at/${href}`)).toBe(
      '<img src="/at/picture.png"/>',
    );
  });

  it('keeps somebody’s place, one per chapter, and forgets nobody else’s', async () => {
    const books = shelf();

    await books.saveProgress('p1', 'c1', { pageNumber: null, fraction: 0.2, isFinished: false });
    await books.saveProgress('p1', 'c1', { pageNumber: null, fraction: 0.5, isFinished: false });

    expect((await books.readProgress('p1', 'b1')).map((one) => one.fraction)).toEqual([0.5]);
    expect(await books.readProgress('p2', 'b1')).toEqual([]);
  });

  it('keeps no place that is nowhere', async () => {
    expect(
      await shelf().saveProgress('p1', 'c1', {
        pageNumber: null,
        fraction: null,
        isFinished: false,
      }),
    ).toBe(false);
  });
});
