import type { BookChapter, ReadingProgress } from '@ValenceContracts/schemas/Book';
import type { BookOpening } from './whereToOpen.types';

/**
 * Where a book opens: in the chapter somebody last read and at the page, or the fraction of the way
 * through, they had reached — or, where they have picked a chapter, at the start of that one. A
 * shelf somebody returns to carries on rather than starting again.
 *
 * @param chapters - The book's chapters, in order.
 * @param progress - How far into each chapter somebody has read.
 * @param chosen - The chapter somebody picked, or nothing to carry on.
 * @returns The chapter to open, or an empty one where the book has none, and where in it to start.
 */
const whereToOpen = (
  chapters: readonly BookChapter[],
  progress: readonly ReadingProgress[],
  chosen: string | null,
): BookOpening => {
  const furthest =
    [...progress].sort(
      (one, other) => Date.parse(other.updatedAt) - Date.parse(one.updatedAt),
    )[0] ?? null;
  const chapterId = chosen ?? furthest?.chapterId ?? chapters[0]?.id ?? '';

  return {
    chapterId,
    startAtPage: chosen === null && furthest !== null ? (furthest.pageNumber ?? 0) : 0,
    startAtFraction: furthest?.chapterId === chapterId ? (furthest.fraction ?? 0) : 0,
  };
};

export { whereToOpen };
