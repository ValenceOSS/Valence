import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';

type Arranging = {
  order: BrowseOrder;
  isHidingWatched: boolean;
  isWatched: (item: MediaSummary) => boolean;
};

/**
 * When something came out, as a string that sorts by date: its release date where the catalogue
 * gave one, and the first of its year where it only gave the year.
 *
 * @param item - The film or programme.
 * @returns The date, or an empty string for something with neither, which sorts last.
 */
const releasedOn = (item: MediaSummary): string =>
  item.releaseDate ?? (item.year === null ? '' : `${item.year.toString()}-01-01`);

/**
 * Puts a page of the library in the order somebody chose, leaving out what they have already
 * watched where they asked to. Newest first for dates, largest first for size and best first for
 * rating, since those are the ends people look for; titles run A to Z. Anything missing what it is
 * being sorted by goes to the end rather than the start, and ties keep their title order.
 *
 * @param items - What the page holds.
 * @param arranging - The order, whether to leave out what has been watched, and how to tell.
 * @returns The items to show, in that order.
 */
const arrangeForBrowsing = (
  items: readonly MediaSummary[],
  { order, isHidingWatched, isWatched }: Arranging,
): MediaSummary[] => {
  const kept = isHidingWatched ? items.filter((item) => !isWatched(item)) : [...items];
  const byTitle = (left: MediaSummary, right: MediaSummary) =>
    left.title.localeCompare(right.title, undefined, { sensitivity: 'base', numeric: true });
  const descending = (left: number | string | null, right: number | string | null) => {
    if (left === right) {
      return 0;
    }

    if (left === null || left === '') {
      return 1;
    }

    if (right === null || right === '') {
      return -1;
    }

    return left < right ? 1 : -1;
  };

  return kept.sort((left, right) => {
    const first =
      order === 'added'
        ? descending(left.addedAt, right.addedAt)
        : order === 'released'
          ? descending(releasedOn(left), releasedOn(right))
          : order === 'rating'
            ? descending(left.rating ?? null, right.rating ?? null)
            : order === 'size'
              ? descending(left.sizeBytes ?? null, right.sizeBytes ?? null)
              : 0;

    return first === 0 ? byTitle(left, right) : first;
  });
};

export { arrangeForBrowsing };
