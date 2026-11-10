import type { SeriesBook } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The cover a book series is shown with where it has none of its own: the first book of the series
 * that has a cover, in reading order and leaving aside companions and anything placed before the
 * first book, or else any book in it that has one.
 *
 * @param books - The books of the series.
 * @returns The cover, or nothing where none of them has one.
 */
const seriesCoverOf = (
  books: readonly Pick<SeriesBook, 'position' | 'isCompanion' | 'coverUrl'>[],
) => {
  const covered = books.filter((book) => book.coverUrl !== null);
  const numbered = covered
    .map((book) => ({ book, place: Number(book.position) }))
    .filter(({ book, place }) => !book.isCompanion && Number.isFinite(place) && place >= 1)
    .toSorted((one, other) => one.place - other.place);

  return numbered[0]?.book.coverUrl ?? covered[0]?.coverUrl ?? null;
};

export { seriesCoverOf };
