import { describe, expect, it } from 'vitest';
import { describeReadingPlace } from './describeReadingPlace';
import type { BookReading } from '@ValenceContracts/schemas/Book';

const A_READING = {
  chapterId: 'c',
  chapterTitle: 'Chapter 12',
  pageNumber: null,
  pageCount: null,
  fraction: null,
  isFinished: false,
  updatedAt: '2026-09-18T00:00:00.000Z',
};

const reading = (overrides: Partial<Omit<BookReading, 'book'>>): Omit<BookReading, 'book'> => ({
  ...A_READING,
  ...overrides,
});

describe('describeReadingPlace', () => {
  it('says how much of an ebook has been read', () => {
    expect(describeReadingPlace({ ...reading({ fraction: 0.345 }), book: BOOK })).toBe('35% read');
  });

  it('says which page of which chapter somebody got to', () => {
    expect(describeReadingPlace({ ...reading({ pageNumber: 4, pageCount: 40 }), book: BOOK })).toBe(
      'Chapter 12 · page 5 of 40',
    );
  });

  it('leaves out how many pages there are where that is not known', () => {
    expect(describeReadingPlace({ ...reading({ pageNumber: 4 }), book: BOOK })).toBe(
      'Chapter 12 · page 5',
    );
  });
});

const BOOK: BookReading['book'] = {
  id: 'b',
  libraryId: 'l',
  title: 'A Book',
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
