/**
 * Adds a reading to the end of a list, dropping the oldest so the list never holds more than it
 * should.
 *
 * @param list - The readings so far, oldest first.
 * @param item - The newest reading.
 * @param most - How many readings to keep.
 * @returns A new list, oldest first.
 */
const keepRecent = <T>(list: readonly T[], item: T, most: number): T[] =>
  most <= 0 ? [] : [...list, item].slice(-most);

export { keepRecent };
