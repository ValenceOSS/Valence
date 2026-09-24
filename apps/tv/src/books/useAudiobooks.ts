import { useQueries } from '@tanstack/react-query';
import { bookQueries } from '@ValenceClient/query/bookQueries';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Book } from '@ValenceContracts/schemas/Book';

type Audiobooks = { books: Book[]; isPending: boolean };

/**
 * Gathers the books every library holds into the ones there are to hear, by title.
 *
 * @param asked - What each library holds.
 * @returns The audiobooks, and whether any library is still being read.
 */
const gatherAudiobooks = (asked: UseQueryResult<Book[]>[]): Audiobooks => ({
  books: asked
    .flatMap((one) => one.data ?? [])
    .filter((book) => book.hasAudio)
    .toSorted((left, right) => left.title.localeCompare(right.title)),
  isPending: asked.some((one) => one.isPending),
});

/**
 * Every book there is to hear across the server's books libraries, by title — a television is for
 * listening to a book rather than reading one, so a book with no sound in it is left out.
 *
 * @param libraryIds - The books libraries.
 * @returns The audiobooks, and whether any library is still being read.
 */
const useAudiobooks = (libraryIds: readonly string[]): Audiobooks =>
  useQueries({
    queries: libraryIds.map((id) => bookQueries.inLibrary(id)),
    combine: gatherAudiobooks,
  });

export { useAudiobooks };
