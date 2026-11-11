import { fetchItemsAcross } from '@ValenceClient/library/fetchLibrary';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const PAGE_SIZE = 200;

const AT_ONCE = 16;

/**
 * Reads everything in some libraries that matches a question, however many that is, ordered across
 * them all, by asking for the first page to learn the total and then the rest of them a few at a
 * time.
 *
 * For the pages that list a whole library. Reading only the first page of them showed the first
 * hundred and twenty films alphabetically and the shows among the first hundred and twenty
 * episodes, and said nothing about the rest.
 *
 * @param libraryIds - The libraries to read.
 * @param options - What is being asked, without a limit or an offset, which are this function's.
 * @returns Everything that matched, in the order the server gave it.
 */
const readEveryItem = async (
  libraryIds: readonly string[],
  options: Omit<ListItemsOptions, 'limit' | 'offset'> = {},
): Promise<MediaSummary[]> => {
  const first = await fetchItemsAcross(libraryIds, { ...options, limit: PAGE_SIZE, offset: 0 });
  const offsets: number[] = [];

  for (let offset = PAGE_SIZE; offset < first.total; offset += PAGE_SIZE) {
    offsets.push(offset);
  }

  const later: MediaSummary[][] = [];

  for (let start = 0; start < offsets.length; start += AT_ONCE) {
    later.push(
      ...(await Promise.all(
        offsets
          .slice(start, start + AT_ONCE)
          .map((offset) =>
            fetchItemsAcross(libraryIds, { ...options, limit: PAGE_SIZE, offset }).then(
              (page) => page.items,
            ),
          ),
      )),
    );
  }

  return [...first.items, ...later.flat()];
};

export { readEveryItem };
