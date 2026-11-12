/**
 * Answers a question asked of every library at once by asking each library in turn, so a test that
 * answers library by library also answers a page that reads every library in one request.
 *
 * @param ofOne - How one library answers.
 * @returns How every library answers together: everything each found, and how many in all.
 */
const askedOfEachLibrary =
  <Options, Item>(
    ofOne: (libraryId: string, options: Options) => Promise<{ items: Item[]; total: number }>,
  ) =>
  async (
    libraryIds: readonly string[],
    options: Options,
  ): Promise<{ items: Item[]; total: number }> => {
    const pages = await Promise.all(libraryIds.map(async (libraryId) => ofOne(libraryId, options)));

    return {
      items: pages.flatMap((page) => page.items),
      total: pages.reduce((sum, page) => sum + page.total, 0),
    };
  };

export { askedOfEachLibrary };
