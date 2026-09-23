import type { Book } from '@ValenceContracts/schemas/Book';

type BookSeries = { name: string; books: Book[] };

type OnTheShelf = { kind: 'book'; book: Book } | { kind: 'series'; series: BookSeries };

const IN_ORDER = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

/**
 * Puts a series' books in the order they are read: by their place in it, then the year they came
 * out, then their titles, a book with no place coming after those with one.
 *
 * @param books - The series' books.
 * @returns Them, in order.
 */
const inSeriesOrder = (books: readonly Book[]): Book[] =>
  books.toSorted(
    (one, other) =>
      (one.series?.position ?? Number.POSITIVE_INFINITY) -
        (other.series?.position ?? Number.POSITIVE_INFINITY) ||
      (one.year ?? 0) - (other.year ?? 0) ||
      IN_ORDER.compare(one.title, other.title),
  );

/**
 * What a shelf shows: its books, with those that are one series gathered into a single place on
 * it, where its first book would have been. A series the shelf holds only one book of is left as
 * that book, since a series of one is no more than the book.
 *
 * @param books - The shelf's books, in the order it shows them.
 * @returns What it shows, in that order.
 */
const gatherSeries = (books: readonly Book[]): OnTheShelf[] => {
  const keyOf = (book: Book): string | null => book.series?.name.trim().toLowerCase() ?? null;
  const together = new Map<string, Book[]>();

  for (const book of books) {
    const key = keyOf(book);

    if (key !== null) {
      together.set(key, [...(together.get(key) ?? []), book]);
    }
  }

  const shown = new Set<string>();

  return books.flatMap((book): OnTheShelf[] => {
    const key = keyOf(book);
    const series = key === null ? undefined : together.get(key);

    if (key === null || series === undefined || series.length < 2) {
      return [{ kind: 'book', book }];
    }

    if (shown.has(key)) {
      return [];
    }

    shown.add(key);

    return [
      {
        kind: 'series',
        series: { name: book.series?.name ?? '', books: inSeriesOrder(series) },
      },
    ];
  });
};

export type { BookSeries, OnTheShelf };

export { gatherSeries, inSeriesOrder };
