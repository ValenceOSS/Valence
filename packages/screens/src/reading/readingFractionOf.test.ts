import { describe, expect, it } from 'vitest';
import { readingFractionOf } from './readingFractionOf';
import type { BookReading } from '@ValenceContracts/schemas/Book';

const reading = (overrides: Partial<BookReading>): BookReading => ({
  book: {
    id: 'b',
    libraryId: 'l',
    title: 'A Book',
    layout: 'fixed',
    direction: 'rightToLeft',
    year: null,
    overview: null,
    genres: null,
    authors: null,
    rating: null,
    hasCover: true,
    chapterCount: 1,
    addedAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
  },
  chapterId: 'c',
  chapterTitle: 'Chapter 1',
  pageNumber: null,
  pageCount: null,
  fraction: null,
  isFinished: false,
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

describe('readingFractionOf', () => {
  it('uses the share of an ebook read', () => {
    expect(readingFractionOf(reading({ fraction: 0.4 }))).toBe(0.4);
  });

  it('uses how far through the chapter somebody is in a comic', () => {
    expect(readingFractionOf(reading({ pageNumber: 9, pageCount: 40 }))).toBe(0.25);
  });

  it('draws nothing where it cannot be told', () => {
    expect(readingFractionOf(reading({ pageNumber: 9 }))).toBe(0);
  });
});
