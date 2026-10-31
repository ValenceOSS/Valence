/**
 * Forgets every key whose last moment is older than a window, so limits kept in memory don't grow
 * with every caller ever seen.
 *
 * @param kept - When things happened, by key.
 * @param windowMilliseconds - How long a moment is kept for.
 * @param at - The moment it is.
 */
const sweepWindows = (
  kept: Map<string, number[]>,
  windowMilliseconds: number,
  at: number,
): void => {
  for (const [key, moments] of kept) {
    if (moments.every((moment) => at - moment >= windowMilliseconds)) {
      kept.delete(key);
    }
  }
};

export { sweepWindows };
