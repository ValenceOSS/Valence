import { describe, expect, it } from 'vitest';
import {
  BOOKMARK_EXCERPT_MOST,
  BOOKMARK_PICTURE_MOST,
  BOOK_DOCUMENT_TAGS,
  BookmarkListSchema,
  BookmarkSchema,
  BookChapterSchema,
  BookContentsSchema,
  bookPlaceIn,
  BookSchema,
  directionFor,
  linkToBookPlace,
  ReadingProgressSchema,
  SaveBookmarkSchema,
  SaveReadingProgressSchema,
} from './Book';

const A_BOOK = {
  id: '3f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
  libraryId: '4f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
  title: 'Ore wa Gimai ni Uso wo Tsuku',
  layout: 'fixed',
  direction: 'rightToLeft',
  year: 2022,
  overview: null,
  genres: ['Romance'],
  authors: ['Someone'],
  rating: null,
  posterUrl: null,
  hasCover: true,
  chapterCount: 14,
  addedAt: '2026-08-20T00:00:00.000Z',
  updatedAt: '2026-08-20T00:00:00.000Z',
};

describe('BookSchema', () => {
  it('reads a book', () => {
    expect(BookSchema.safeParse(A_BOOK).success).toBe(true);
  });

  it('refuses a book with no title, which is a book nobody could pick', () => {
    expect(BookSchema.safeParse({ ...A_BOOK, title: '' }).success).toBe(false);
  });

  it('refuses a layout it has no reader for', () => {
    expect(BookSchema.safeParse({ ...A_BOOK, layout: 'scroll' }).success).toBe(false);
  });
});

describe('BookChapterSchema', () => {
  it('keeps a half-numbered chapter, which is how an extra is published', () => {
    const read = BookChapterSchema.safeParse({
      id: '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      bookId: A_BOOK.id,
      number: 10.5,
      title: 'Extra',
      format: 'cbz',
      pageCount: 20,
      addedAt: '2026-08-20T00:00:00.000Z',
    });

    expect(read.success && read.data.number).toBe(10.5);
  });

  it('allows no page count, which is every chapter that reflows', () => {
    const read = BookChapterSchema.safeParse({
      id: '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      bookId: A_BOOK.id,
      number: 1,
      title: 'One',
      format: 'epub',
      pageCount: null,
      addedAt: '2026-08-20T00:00:00.000Z',
    });

    expect(read.success).toBe(true);
  });
});

describe('ReadingProgressSchema', () => {
  it('holds a place in a fixed book as a page', () => {
    const read = ReadingProgressSchema.safeParse({
      bookId: A_BOOK.id,
      chapterId: '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      pageNumber: 12,
      fraction: null,
      isFinished: false,
      updatedAt: '2026-08-20T00:00:00.000Z',
    });

    expect(read.success).toBe(true);
  });

  it('holds a place in reflowing text as a fraction of it', () => {
    const read = ReadingProgressSchema.safeParse({
      bookId: A_BOOK.id,
      chapterId: '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      pageNumber: null,
      fraction: 0.42,
      isFinished: false,
      updatedAt: '2026-08-20T00:00:00.000Z',
    });

    expect(read.success).toBe(true);
  });

  it('refuses a fraction outside the text', () => {
    const read = ReadingProgressSchema.safeParse({
      bookId: A_BOOK.id,
      chapterId: '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      pageNumber: null,
      fraction: 1.5,
      isFinished: false,
      updatedAt: '2026-08-20T00:00:00.000Z',
    });

    expect(read.success).toBe(false);
  });
});

describe('SaveReadingProgressSchema', () => {
  it('takes finishing as not said, since most saves are somebody still reading', () => {
    const read = SaveReadingProgressSchema.safeParse({ pageNumber: 3, fraction: null });

    expect(read.success && read.data.isFinished).toBe(false);
  });
});

const A_CHAPTER_ID = '5f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

describe('SaveBookmarkSchema', () => {
  it('takes a page on its own, with nothing to show beside it', () => {
    const read = SaveBookmarkSchema.safeParse({
      chapterId: A_CHAPTER_ID,
      pageNumber: 4,
      fraction: null,
    });

    expect(read.success && read.data).toEqual({
      chapterId: A_CHAPTER_ID,
      pageNumber: 4,
      fraction: null,
      pageShown: null,
      excerpt: null,
      picture: null,
    });
  });

  it('takes a fraction with the words or the picture there', () => {
    const read = SaveBookmarkSchema.safeParse({
      chapterId: A_CHAPTER_ID,
      pageNumber: null,
      fraction: 0.4,
      pageShown: null,
      excerpt: 'It was the best of times',
      picture: 'OEBPS/images/p2.png',
    });

    expect(read.success).toBe(true);
  });

  it('refuses a bookmark with neither a page nor a fraction', () => {
    const read = SaveBookmarkSchema.safeParse({
      chapterId: A_CHAPTER_ID,
      pageNumber: null,
      fraction: null,
    });

    expect(read.success).toBe(false);
  });

  it('refuses an excerpt or a picture longer than it keeps, or empty', () => {
    const place = { chapterId: A_CHAPTER_ID, pageNumber: null, fraction: 0.5 };

    expect(
      SaveBookmarkSchema.safeParse({ ...place, excerpt: 'a'.repeat(BOOKMARK_EXCERPT_MOST + 1) })
        .success,
    ).toBe(false);
    expect(
      SaveBookmarkSchema.safeParse({ ...place, picture: 'a'.repeat(BOOKMARK_PICTURE_MOST + 1) })
        .success,
    ).toBe(false);
    expect(SaveBookmarkSchema.safeParse({ ...place, excerpt: '' }).success).toBe(false);
  });

  it('refuses a fraction past the end of the book', () => {
    expect(
      SaveBookmarkSchema.safeParse({ chapterId: A_CHAPTER_ID, pageNumber: null, fraction: 1.2 })
        .success,
    ).toBe(false);
  });
});

describe('BookmarkSchema', () => {
  it('reads a list of bookmarks as the server sends it', () => {
    const bookmark = {
      id: '6f1b6c9e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
      bookId: A_BOOK.id,
      chapterId: A_CHAPTER_ID,
      pageNumber: null,
      fraction: 0.25,
      pageShown: null,
      excerpt: null,
      picture: 'OEBPS/images/p2.png',
      createdAt: '2026-11-11T00:00:00.000Z',
    };

    expect(BookmarkSchema.parse(bookmark)).toEqual(bookmark);
    expect(BookmarkListSchema.parse({ bookmarks: [bookmark] }).bookmarks).toHaveLength(1);
  });

  it('refuses a bookmark whose id is not one', () => {
    expect(
      BookmarkSchema.safeParse({
        id: 'one',
        bookId: A_BOOK.id,
        chapterId: A_CHAPTER_ID,
        pageNumber: 1,
        fraction: null,
        pageShown: null,
        excerpt: null,
        picture: null,
        createdAt: '2026-11-11T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });
});

describe('directionFor', () => {
  it('reads a fixed book right to left, which is what manga is', () => {
    expect(directionFor('fixed')).toBe('rightToLeft');
  });

  it('reads flowing text left to right, which is what a novel is', () => {
    expect(directionFor('reflow')).toBe('leftToRight');
  });
});

describe('linkToBookPlace and bookPlaceIn', () => {
  it('writes a place in a book as a link, and reads it back', () => {
    expect(bookPlaceIn(linkToBookPlace(3, 'chapter-two'))).toEqual({
      part: 3,
      anchor: 'chapter-two',
    });
  });

  it('writes the start of a part with no anchor', () => {
    expect(linkToBookPlace(0, null)).toBe('#valence-part-0');
    expect(bookPlaceIn('#valence-part-0')).toEqual({ part: 0, anchor: null });
  });

  it('reads no place from a link that leads out of the book', () => {
    expect(bookPlaceIn('https://example.com/#valence-part-1')).toBeNull();
    expect(bookPlaceIn('#somewhere')).toBeNull();
  });
});

describe('BookContentsSchema', () => {
  it('reads how a book is divided', () => {
    const contents = {
      parts: [{ size: 10 }],
      contents: [{ title: 'Chapter I.', part: 0, anchor: null, depth: 0 }],
    };

    expect(BookContentsSchema.parse(contents)).toEqual(contents);
  });
});

describe('BOOK_DOCUMENT_TAGS', () => {
  it('lets through what text is made of', () => {
    expect(BOOK_DOCUMENT_TAGS).toContain('p');
    expect(BOOK_DOCUMENT_TAGS).toContain('img');
  });

  it('lets through nothing that runs or embeds', () => {
    for (const tag of ['script', 'iframe', 'object', 'embed', 'style', 'form', 'input']) {
      expect(BOOK_DOCUMENT_TAGS).not.toContain(tag);
    }
  });
});
