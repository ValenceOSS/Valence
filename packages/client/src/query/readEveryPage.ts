const MOST_PAGES = 100;

/**
 * Reads a list a page at a time until a page comes back short, for a list the server answers in
 * pages without saying how long it is. A list still going after a hundred pages fails rather than
 * being read for ever, which is what a server too old to take an offset would cause, answering the
 * first page every time.
 *
 * @param readPage - How to read the page starting at an offset.
 * @param pageSize - How many a full page holds.
 * @returns Everything in the list, in order.
 */
const readEveryPage = async <T>(
  readPage: (offset: number, limit: number) => Promise<readonly T[]>,
  pageSize: number,
): Promise<T[]> => {
  const read: T[] = [];

  for (let pages = 0; pages < MOST_PAGES; pages += 1) {
    const page = await readPage(read.length, pageSize);

    read.push(...page);

    if (page.length < pageSize) {
      return read;
    }
  }

  throw new Error(`The list ran past ${MOST_PAGES.toString()} pages, which no list here is.`);
};

export { readEveryPage };
