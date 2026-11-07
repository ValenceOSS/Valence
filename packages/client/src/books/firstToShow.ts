/**
 * The first part a book can be shown from, opening at a given part: that part, or where it holds
 * nothing, as a cover the server could not read does, the first after it that holds something —
 * once every part up to it has arrived.
 *
 * @param parts - The parts arrived so far, each as its blocks.
 * @param from - The part it opens at.
 * @returns The part to show from, or nothing until one has arrived.
 */
const firstToShow = <T>(
  parts: readonly ({ blocks: readonly T[] } | undefined)[],
  from: number,
): number | null => {
  for (let at = from; at < parts.length; at += 1) {
    const part = parts[at];

    if (part === undefined) {
      return null;
    }

    if (part.blocks.length > 0) {
      return at;
    }
  }

  return null;
};

export { firstToShow };
