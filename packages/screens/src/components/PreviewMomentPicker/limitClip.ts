/**
 * Keeps a clip within the longest it may be by moving the handle that was not being dragged, so
 * pulling either end past the limit carries the other along with it.
 *
 * @param lower - Where the start handle is.
 * @param upper - Where the end handle is.
 * @param previousEnd - Where the end handle was before this move, which says which handle moved.
 * @param longestSeconds - The longest a clip may be.
 * @returns The start and end of the clip, no further apart than the limit.
 */
const limitClip = (
  lower: number,
  upper: number,
  previousEnd: number,
  longestSeconds: number,
): [number, number] => {
  if (upper - lower <= longestSeconds) {
    return [lower, upper];
  }

  return upper === previousEnd ? [lower, lower + longestSeconds] : [upper - longestSeconds, upper];
};

export { limitClip };
