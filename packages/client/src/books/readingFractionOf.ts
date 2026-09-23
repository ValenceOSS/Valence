import type { BookReading } from '@ValenceContracts/schemas/Book';

/**
 * How full a book's progress bar is: the share of an ebook read, or how far through the chapter
 * somebody is in a comic.
 *
 * @param reading - Where they are in it.
 * @returns From 0 to 1.
 */
const readingFractionOf = (reading: BookReading): number => {
  if (reading.fraction !== null) {
    return reading.fraction;
  }

  return reading.pageCount === null || reading.pageNumber === null
    ? 0
    : Math.min((reading.pageNumber + 1) / reading.pageCount, 1);
};

export { readingFractionOf };
