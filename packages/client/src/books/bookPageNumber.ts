import { fractionOfBook } from '@ValenceClient/books/fractionOfBook';

/**
 * What page of the whole book a page of one part is, for numbering it as a printed book would.
 *
 * Only the part being read has been laid out, so the pages before it are reckoned from how much the
 * parts before it hold against how many pages this one made. The numbers run on one at a time within
 * a part, and are as close as that reckoning allows across one.
 *
 * @param sizes - How much each part of the book holds.
 * @param part - The part being read.
 * @param pagesInPart - How many pages it made on this screen.
 * @param page - The page within it, counting from zero.
 * @returns The page's number in the book, counting from one.
 */
const bookPageNumber = (
  sizes: readonly number[],
  part: number,
  pagesInPart: number,
  page: number,
): number => {
  const startsAt = fractionOfBook(sizes, part, 0);
  const share = fractionOfBook(sizes, part, 1) - startsAt;

  if (share <= 0 || pagesInPart <= 0) {
    return page + 1;
  }

  return Math.round((startsAt * pagesInPart) / share) + page + 1;
};

export { bookPageNumber };
