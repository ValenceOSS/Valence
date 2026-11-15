import { fetchItemsAcross } from '@ValenceClient/library/fetchLibrary';
import type { ListItemsOptions } from '@ValenceClient/library/fetchLibrary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const PAGE_SIZE = 200;

const AT_ONCE = 16;

/**
 * Reads everything in some libraries that matches a question, handing over the first page as soon
 * as it arrives and then each group of pages read together after it, in the order the server gave.
 *
 * @param libraryIds - The libraries to read.
 * @param options - What is being asked, without a limit or an offset, which are this function's.
 * @param signal - Told when the pages are no longer wanted, after which no more are read or handed
 *   over, so a read given up for a newer one cannot add its pages to the newer one's.
 * @returns The pages, as they come.
 */
async function* readEveryItemAsItComes(
  libraryIds: readonly string[],
  options: Omit<ListItemsOptions, 'limit' | 'offset'> = {},
  signal?: AbortSignal,
): AsyncGenerator<readonly MediaSummary[], void, undefined> {
  const isGivenUp = () => signal?.aborted === true;
  const first = await fetchItemsAcross(libraryIds, { ...options, limit: PAGE_SIZE, offset: 0 });
  const offsets: number[] = [];

  if (isGivenUp()) {
    return;
  }

  yield first.items;

  for (let offset = PAGE_SIZE; offset < first.total; offset += PAGE_SIZE) {
    offsets.push(offset);
  }

  for (let start = 0; start < offsets.length && !isGivenUp(); start += AT_ONCE) {
    const pages = await Promise.all(
      offsets
        .slice(start, start + AT_ONCE)
        .map(async (offset) =>
          fetchItemsAcross(libraryIds, { ...options, limit: PAGE_SIZE, offset }, false).then(
            (page) => page.items,
          ),
        ),
    );

    if (isGivenUp()) {
      return;
    }

    yield pages.flat();
  }
}

export { readEveryItemAsItComes };
