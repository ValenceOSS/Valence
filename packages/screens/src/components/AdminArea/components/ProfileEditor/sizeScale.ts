const SIZE_STEPS = 200;

const LARGEST_MB = 40_000;

/**
 * The size an hour a handle on the sizes track stands for, the track being squared so that the
 * sizes most qualities sit at — a few hundred megabytes to a few gigabytes — are not crowded into
 * its first tenth. Either end stands for no limit.
 *
 * @param position - Where the handle is, from nought to the number of steps.
 * @returns Megabytes an hour, or null at either end.
 */
const sizeAt = (position: number): number | null =>
  position <= 0 || position >= SIZE_STEPS
    ? null
    : Math.round((position / SIZE_STEPS) ** 2 * LARGEST_MB);

/**
 * Where on the sizes track a size an hour sits, no limit going to the bottom for a smallest size
 * and the top for a largest.
 *
 * @param megabytes - Megabytes an hour, or null for no limit.
 * @param end - Whether it is the smallest or the largest.
 * @returns The position.
 */
const positionOf = (megabytes: number | null, end: 'smallest' | 'largest'): number => {
  if (megabytes === null) {
    return end === 'smallest' ? 0 : SIZE_STEPS;
  }

  return Math.min(
    Math.max(Math.round(Math.sqrt(megabytes / LARGEST_MB) * SIZE_STEPS), 1),
    SIZE_STEPS - 1,
  );
};

export { SIZE_STEPS, positionOf, sizeAt };
