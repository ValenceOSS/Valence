import { describe, expect, it } from 'vitest';
import { booksFollowed } from './booksFollowed';

const book = (asin: string, isCompanion: boolean, openLibraryId: number | null = 1) => ({
  asin,
  title: asin,
  position: null,
  isCompanion,
  author: null,
  year: null,
  openLibraryId,
  coverUrl: null,
  narrations: [],
});

describe('booksFollowed', () => {
  it('follows the main books, and the companions ticked, that Open Library knows', () => {
    const books = [
      book('B000000001', false),
      book('B000000002', true),
      book('B000000003', true),
      book('B000000004', false, null),
    ];

    expect(
      booksFollowed({ books, companionsWanted: ['B000000003'] }).map((one) => one.asin),
    ).toEqual(['B000000001', 'B000000003']);
  });
});
