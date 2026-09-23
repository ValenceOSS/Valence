import { BookChapterSchema } from '@ValenceContracts/schemas/Book';
import type { BookChapter } from '@ValenceContracts/schemas/Book';

/**
 * A chapter of a book to draw a screen against, numbered so several can be told apart.
 *
 * @param n - Which chapter.
 * @param overrides - Anything about it that matters to the test.
 * @returns The chapter.
 */
const aChapter = (n: number, overrides: Partial<BookChapter> = {}): BookChapter =>
  BookChapterSchema.parse({
    id: `00000000-0000-4000-8000-0000000000c${n.toString()}`,
    bookId: '00000000-0000-4000-8000-0000000000b0',
    number: n,
    title: `Chapter ${n.toString()}`,
    format: 'epub',
    pageCount: null,
    addedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

export { aChapter };
