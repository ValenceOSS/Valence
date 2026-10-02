const BATCH = 25;

/**
 * Some things in batches of at most as many as the server takes at once.
 *
 * @param items - The things.
 * @returns The batches, in order.
 */
const wantedBatchesOf = <Item>(items: readonly Item[]): Item[][] =>
  Array.from({ length: Math.ceil(items.length / BATCH) }, (_, index) =>
    items.slice(index * BATCH, (index + 1) * BATCH),
  );

export { BATCH, wantedBatchesOf };
