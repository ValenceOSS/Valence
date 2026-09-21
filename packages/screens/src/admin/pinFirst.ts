/**
 * Puts the pinned things first, each group keeping the order it had.
 *
 * @param rows - The things, in the order they were asked for.
 * @param pinned - The ids of the ones pinned.
 * @param idOf - Names a thing by what it is.
 * @returns The pinned ones, then the rest.
 */
const pinFirst = <Row>(
  rows: readonly Row[],
  pinned: ReadonlySet<string>,
  idOf: (row: Row) => string,
): Row[] => [
  ...rows.filter((row) => pinned.has(idOf(row))),
  ...rows.filter((row) => !pinned.has(idOf(row))),
];

export { pinFirst };
