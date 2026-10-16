import type { SeriesBook } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Which narration of a series' book is fetched without asking: the only one; the one read by
 * whoever reads the series in the library already; or, where the series keeps one narrator, the one
 * read by the same people as a book of it already chosen. Nothing where somebody should choose.
 *
 * @param book - The book.
 * @param libraryNarrators - Who reads the series' audiobooks in the library.
 * @param chosenReaders - Who reads each narration already chosen for the series' other books.
 * @param keepsOneNarrator - Whether the series keeps one narrator.
 * @returns The narration chosen, by its Audible id, or null for a choice to be made.
 */
const narrationOfSeriesBook = (
  book: Pick<SeriesBook, 'narrations'>,
  libraryNarrators: readonly string[],
  chosenReaders: readonly (readonly string[])[],
  keepsOneNarrator: boolean,
): string | null => {
  const [only, ...others] = book.narrations;

  if (only === undefined) {
    return null;
  }

  if (others.length === 0) {
    return only.asin;
  }

  const known = new Set(libraryNarrators.map((name) => name.toLowerCase()));
  const byLibrary = book.narrations.find((narration) =>
    narration.narrators.some((name) => known.has(name.toLowerCase())),
  );

  if (byLibrary !== undefined) {
    return byLibrary.asin;
  }

  const sameReaders = (narrators: readonly string[], readers: readonly string[]) =>
    narrators.length === readers.length &&
    narrators.every((name) =>
      readers.some((reader) => reader.toLowerCase() === name.toLowerCase()),
    );

  return keepsOneNarrator
    ? (book.narrations.find((narration) =>
        chosenReaders.some((readers) => sameReaders(narration.narrators, readers)),
      )?.asin ?? null)
    : null;
};

export { narrationOfSeriesBook };
