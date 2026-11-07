/**
 * Where a page of a book set as one run of pages falls among the book's parts: which part it is in,
 * and how far through that part it starts and ends. A part with nothing in it takes no pages, so it
 * starts on the same page as the part after it, and a page belongs to the last part starting there.
 *
 * @param starts - The page each part starts on.
 * @param count - How many pages the book has.
 * @param page - The page.
 * @returns The part, and how far through it the page starts and ends, from 0 to 1.
 */
const placeOfPage = (
  starts: readonly number[],
  count: number,
  page: number,
): { part: number; within: number; withinEnd: number } => {
  let part = 0;

  starts.forEach((start, at) => {
    if (start <= page && (starts[at + 1] ?? count) > start) {
      part = at;
    }
  });

  const start = starts[part] ?? 0;
  const pages = Math.max((starts[part + 1] ?? count) - start, 1);

  return {
    part,
    within: Math.min(Math.max((page - start) / pages, 0), 1),
    withinEnd: Math.min(Math.max((page + 1 - start) / pages, 0), 1),
  };
};

export { placeOfPage };
