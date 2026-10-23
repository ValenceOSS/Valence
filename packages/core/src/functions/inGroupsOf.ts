/**
 * Splits a list into consecutive groups of at most a given size, in order.
 *
 * @param items - The list.
 * @param size - The most each group may hold.
 * @returns The groups, none of them empty.
 */
const inGroupsOf = <T>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, group) =>
    items.slice(group * size, (group + 1) * size),
  );

export { inGroupsOf };
