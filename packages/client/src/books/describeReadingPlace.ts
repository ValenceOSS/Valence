import type { BookReading } from '@ValenceContracts/schemas/Book';
import { say } from '@ValenceI18n/say';

/**
 * Says how far into a book somebody got: a share of it for text that reflows, and a page of a
 * chapter for a book of pages.
 *
 * @param reading - Where they are in it.
 * @returns What to say.
 */
const describeReadingPlace = (reading: BookReading): string => {
  if (reading.fraction !== null) {
    return say('common.percentRead', { percent: Math.round(reading.fraction * 100).toString() });
  }

  const page = (reading.pageNumber ?? 0) + 1;

  return reading.pageCount === null
    ? say('client.books.describeReadingPlace.chapterTitlePagePage', {
        chapterTitle: reading.chapterTitle,
        page: page.toString(),
      })
    : say('client.books.describeReadingPlace.chapterTitlePagePageOfPageCount', {
        chapterTitle: reading.chapterTitle,
        page: page.toString(),
        pageCount: reading.pageCount.toString(),
      });
};

export { describeReadingPlace };
