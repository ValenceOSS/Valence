/**
 * Finds a place given as a fraction of the way through a whole book: which part it falls in, and how
 * far into that part.
 *
 * The parts are weighed by how much they hold, so a book split into one short part and one long one
 * is not treated as two halves. A book whose parts all hold nothing is weighed as though they held
 * the same.
 *
 * @param sizes - How much each part holds, in order.
 * @param fraction - How far through the book, from 0 to 1.
 * @returns The part, and how far into it from 0 to 1.
 */
const placeInBook = (
  sizes: readonly number[],
  fraction: number,
): { part: number; within: number } => {
  const weights = sizes.every((size) => size <= 0) ? sizes.map(() => 1) : sizes;
  const total = weights.reduce((sum, size) => sum + Math.max(size, 0), 0);

  if (weights.length === 0 || total === 0) {
    return { part: 0, within: 0 };
  }

  const wanted = Math.min(Math.max(fraction, 0), 1) * total;
  let before = 0;

  for (const [part, size] of weights.entries()) {
    const held = Math.max(size, 0);

    if (wanted < before + held || part === weights.length - 1) {
      return { part, within: held === 0 ? 0 : Math.min((wanted - before) / held, 1) };
    }

    before += held;
  }

  return { part: weights.length - 1, within: 1 };
};

export { placeInBook };
