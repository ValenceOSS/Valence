import { BookSchema } from '@ValenceContracts/schemas/Book';
import type { Book } from '@ValenceContracts/schemas/Book';

/**
 * A book to draw a screen against.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The book.
 */
const aBook = (overrides: Partial<Book> = {}): Book =>
  BookSchema.parse({
    id: '00000000-0000-4000-8000-0000000000b0',
    libraryId: '00000000-0000-4000-8000-0000000000b1',
    title: 'Dune',
    layout: 'reflow',
    direction: 'leftToRight',
    year: 1965,
    overview: 'A desert planet.',
    genres: null,
    authors: ['Frank Herbert'],
    rating: null,
    hasCover: false,
    chapterCount: 1,
    addedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

export { aBook };
