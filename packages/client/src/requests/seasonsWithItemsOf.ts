import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The seasons a series request waits for something of, in order.
 *
 * @param items - What it waits for.
 * @returns The season numbers.
 */
const seasonsWithItemsOf = (items: readonly Pick<RequestItem, 'season'>[]): number[] =>
  [...new Set(items.flatMap((item) => (item.season === null ? [] : [item.season])))].sort(
    (left, right) => left - right,
  );

export { seasonsWithItemsOf };
