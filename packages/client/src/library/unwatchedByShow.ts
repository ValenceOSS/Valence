import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * How many episodes of each programme whoever is watching has not seen to the end, keyed as
 * programmes are gathered everywhere else — by the series, or its name where it has none.
 *
 * @param items - Every episode there is to count.
 * @param isFinished - Whether this viewer has watched an item to the end.
 * @returns The count left, by programme.
 */
const unwatchedByShow = (
  items: readonly MediaSummary[],
  isFinished: (mediaId: string) => boolean,
): Map<string, number> => {
  const left = new Map<string, number>();

  for (const item of items) {
    const show = item.seriesId ?? item.seriesTitle ?? null;

    if (show === null) {
      continue;
    }

    left.set(show, (left.get(show) ?? 0) + (isFinished(item.id) ? 0 : 1));
  }

  return left;
};

export { unwatchedByShow };
