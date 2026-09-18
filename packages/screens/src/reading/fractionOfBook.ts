/**
 * Says how far through a whole book a place is, from which part it is in and how far into that part.
 * The reverse of `placeInBook`, and weighed the same way.
 *
 * @param sizes - How much each part holds, in order.
 * @param part - Which part.
 * @param within - How far into it, from 0 to 1.
 * @returns How far through the book, from 0 to 1.
 */
const fractionOfBook = (sizes: readonly number[], part: number, within: number): number => {
  const weights = sizes.every((size) => size <= 0) ? sizes.map(() => 1) : sizes;
  const total = weights.reduce((sum, size) => sum + Math.max(size, 0), 0);

  if (total === 0) {
    return 0;
  }

  const before = weights.slice(0, part).reduce((sum, size) => sum + Math.max(size, 0), 0);
  const here = Math.max(weights[part] ?? 0, 0) * Math.min(Math.max(within, 0), 1);

  return Math.min((before + here) / total, 1);
};

export { fractionOfBook };
