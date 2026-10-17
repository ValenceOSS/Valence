/**
 * Pins a page that is not pinned, at the end, or unpins one that is.
 *
 * @param pinned - The pages pinned now, in order.
 * @param id - The page.
 * @returns The pages pinned after.
 */
const togglePinned = (pinned: readonly string[], id: string): string[] =>
  pinned.includes(id) ? pinned.filter((one) => one !== id) : [...pinned, id];

export { togglePinned };
