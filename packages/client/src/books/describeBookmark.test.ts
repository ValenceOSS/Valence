import { describe, expect, it } from 'vitest';
import { describeBookmark } from './describeBookmark';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

const A_BOOKMARK: Bookmark = {
  id: 'mark',
  bookId: 'book',
  chapterId: 'two',
  pageNumber: 11,
  fraction: null,
  pageShown: null,
  excerpt: null,
  picture: null,
  createdAt: '2026-11-11T00:00:00.000Z',
};

const CHAPTERS = [
  { id: 'one', title: 'Volume 1' },
  { id: 'two', title: 'Volume 2' },
];

describe('describeBookmark', () => {
  it('names a page bookmark by its page, with its chapter and a picture of the page', () => {
    expect(describeBookmark(A_BOOKMARK, CHAPTERS, 120)).toEqual({
      id: 'mark',
      place: 'Page 12',
      chapter: 'Volume 2',
      excerpt: null,
      picture: '/api/books/book/chapters/two/pages/11?width=120',
    });
  });

  it('leaves the chapter out of a book that has only one', () => {
    expect(
      describeBookmark(A_BOOKMARK, [{ id: 'two', title: 'Volume 2' }], 120).chapter,
    ).toBeNull();
  });

  it('names a place in the text by how far through it is, with the words there', () => {
    expect(
      describeBookmark(
        {
          ...A_BOOKMARK,
          pageNumber: null,
          fraction: 0.374,
          pageShown: null,
          excerpt: 'It was the best of times',
        },
        CHAPTERS,
        120,
      ),
    ).toMatchObject({ place: '37%', excerpt: 'It was the best of times', picture: null });
  });

  it('shows the picture a place in a book of pictures falls on', () => {
    expect(
      describeBookmark(
        { ...A_BOOKMARK, pageNumber: null, fraction: 0.5, picture: 'OEBPS/images/p2.png' },
        CHAPTERS,
        120,
      ).picture,
    ).toBe('/api/books/book/chapters/two/resource?href=OEBPS%2Fimages%2Fp2.png');
  });
});
