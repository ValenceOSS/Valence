/**
 * Reads a list a page at a time until a page comes back short, for a list the server answers in
 * pages without saying how long it is.
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

  for (;;) {
    const page = await readPage(read.length, pageSize);

    read.push(...page);

    if (page.length < pageSize) {
      return read;
    }
  }
};

export { readEveryPage };
