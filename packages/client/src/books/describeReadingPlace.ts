import type { BookReading } from '@ValenceContracts/schemas/Book';

/**
 * Says how far into a book somebody got: a share of it for text that reflows, and a page of a
 * chapter for a book of pages.
 *
 * @param reading - Where they are in it.
 * @returns What to say.
 */
const describeReadingPlace = (reading: BookReading): string => {
  if (reading.fraction !== null) {
    return `${Math.round(reading.fraction * 100).toString()}% read`;
  }

  const page = (reading.pageNumber ?? 0) + 1;

  return reading.pageCount === null
    ? `${reading.chapterTitle} · page ${page.toString()}`
    : `${reading.chapterTitle} · page ${page.toString()} of ${reading.pageCount.toString()}`;
};

export { describeReadingPlace };
