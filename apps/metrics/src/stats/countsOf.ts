/**
 * Counts how many rows fall in each group, counting a row once in a group however many times it
 * names it.
 *
 * @param rows - The rows.
 * @param groupsOf - The groups one row is in.
 * @returns How many rows are in each group.
 */
const countsOf = <Row>(
  rows: readonly Row[],
  groupsOf: (row: Row) => readonly string[],
): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const row of rows) {
    for (const group of new Set(groupsOf(row))) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }

  return counts;
};

export { countsOf };
