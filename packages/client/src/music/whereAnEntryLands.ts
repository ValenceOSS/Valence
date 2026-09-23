/**
 * Which entry a playlist entry lands after when it is moved from one place in the list to another,
 * which is how the server is told where it goes — nothing, for the very top.
 *
 * @param entryIds - The playlist's entries, in their order.
 * @param from - Where the entry is.
 * @param to - Where it is going.
 * @returns The entry it lands after, or null for the top.
 */
const whereAnEntryLands = (entryIds: readonly string[], from: number, to: number): string | null =>
  (to > from ? entryIds[to] : entryIds[to - 1]) ?? null;

export { whereAnEntryLands };
