import type { BookChapter, ReadingProgress } from '@ValenceContracts/schemas/Book';

/**
 * How much of each chapter whoever is reading has read, as a fraction: all of it where they
 * finished it, as far as the page they reached in a paged one, as far as they scrolled in a
 * reflowing one, and none of one they have not opened.
 *
 * @param chapters - The book's chapters.
 * @param progress - Where they got to in each chapter they opened.
 * @returns How far through each chapter they are, by its id.
 */
const chapterProgress = (
  chapters: readonly BookChapter[],
  progress: readonly ReadingProgress[],
): Map<string, number> =>
  new Map(
    chapters.map((chapter) => {
      const got = progress.find((one) => one.chapterId === chapter.id);

      if (got === undefined) {
        return [chapter.id, 0];
      }

      if (got.isFinished) {
        return [chapter.id, 1];
      }

      const byPage =
        got.pageNumber !== null && chapter.pageCount !== null
          ? Math.min((got.pageNumber + 1) / chapter.pageCount, 1)
          : null;

      return [chapter.id, byPage ?? got.fraction ?? 0];
    }),
  );

export { chapterProgress };
