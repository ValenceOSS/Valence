/**
 * Which segments of a loading ring are lit at a given tick: they light one by one until the ring is
 * full, then go dark one by one from where they started, and the ring begins again.
 *
 * @param ticks - How many ticks have passed.
 * @param count - How many segments the ring has.
 * @returns The first lit segment and the one after the last.
 */
const segmentsLitAt = (ticks: number, count: number): { from: number; lit: number } => {
  const phase = ticks % (count * 2);

  return phase >= count ? { from: phase - count + 1, lit: count } : { from: 0, lit: phase + 1 };
};

export { segmentsLitAt };
