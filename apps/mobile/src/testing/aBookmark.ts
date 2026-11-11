import { BookmarkSchema } from '@ValenceContracts/schemas/Book';
import type { Bookmark } from '@ValenceContracts/schemas/Book';

/**
 * A bookmark in the first chapter of a book, to draw a reader against.
 *
 * @param id - What it is called, so several can be told apart.
 * @param overrides - Anything about it that matters to the test, such as its page or fraction.
 * @returns The bookmark.
 */
const aBookmark = (id: string, overrides: Partial<Bookmark> = {}): Bookmark =>
  BookmarkSchema.parse({
    id: `00000000-0000-4000-8000-${id.padStart(12, '0')}`,
    bookId: '00000000-0000-4000-8000-0000000000b0',
    chapterId: '00000000-0000-4000-8000-0000000000c1',
    pageNumber: null,
    fraction: null,
    pageShown: null,
    excerpt: null,
    picture: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

export { aBookmark };
