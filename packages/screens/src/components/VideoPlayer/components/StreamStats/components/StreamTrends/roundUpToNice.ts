/**
 * Rounds a reading up to the next 1, 2 or 5 times a power of ten, so a chart's scale lands on a
 * figure somebody can read at a glance.
 *
 * @param value - The highest reading to fit.
 * @returns The scale's top, never below one.
 */
const roundUpToNice = (value: number): number => {
  if (!Number.isFinite(value) || value <= 1) {
    return 1;
  }

  const power = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((multiple) => multiple * power >= value) ?? 10;

  return step * power;
};

export { roundUpToNice };
