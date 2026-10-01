import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { BrowseOrder } from '@ValenceClient/library/BrowseOrder';
import { collapseToShows } from '@ValenceClient/library/pickFeatured';
import { unwatchedByShow } from '@ValenceClient/library/unwatchedByShow';
import { addedAtMs } from '@ValenceCore/functions/addedAtMs';

type Arranging = {
  order: BrowseOrder;
  isHidingWatched: boolean;
  isFinished: (mediaId: string) => boolean;
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
 * The programme an episode belongs to, keyed as programmes are gathered everywhere else.
 *
 * @param item - A film or an episode.
 * @returns The programme, or null for a film.
 */
const showOf = (item: MediaSummary): string | null => item.seriesId ?? item.seriesTitle ?? null;

/**
 * When the newest episode of each programme arrived, which is when the programme last changed.
 *
 * @param items - Every film and episode there is.
 * @returns The newest arrival, by programme.
 */
const newestByShow = (items: readonly MediaSummary[]): Map<string, number> => {
  const newest = new Map<string, number>();

  for (const item of items) {
    const show = showOf(item);

    if (show !== null) {
      newest.set(show, Math.max(newest.get(show) ?? 0, addedAtMs(item.addedAt)));
    }
  }

  return newest;
};

/**
 * Puts a page of the library in the order somebody chose, one card to a programme, leaving out what
 * they have already watched where they asked to. Newest first for dates, largest first for size and
 * best first for rating; titles run A to Z, a programme by its own name. A programme counts as added
 * when its newest episode was, and as watched when nothing of it is left. Anything missing what it
 * is sorted by goes last, and ties keep their title order.
 *
 * @param items - Every film or episode the page holds.
 * @param arranging - The order, whether to leave out what has been watched, and what has been.
 * @returns The cards to show, in that order.
 */
const arrangeForBrowsing = (
  items: readonly MediaSummary[],
  { order, isHidingWatched, isFinished }: Arranging,
): MediaSummary[] => {
  const newest = newestByShow(items);
  const left = isHidingWatched ? unwatchedByShow(items, isFinished) : null;
  const cards = collapseToShows(items);
  const kept =
    left === null
      ? cards
      : cards.filter((card) => {
          const show = showOf(card);

          return show === null ? !isFinished(card.id) : left.get(show) !== 0;
        });
  const addedOn = (card: MediaSummary): number => {
    const show = showOf(card);

    return (show === null ? undefined : newest.get(show)) ?? addedAtMs(card.addedAt);
  };
  const byTitle = (left: MediaSummary, right: MediaSummary) =>
    (left.seriesTitle ?? left.title).localeCompare(right.seriesTitle ?? right.title, undefined, {
      sensitivity: 'base',
      numeric: true,
    });
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
        ? descending(addedOn(left), addedOn(right))
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
