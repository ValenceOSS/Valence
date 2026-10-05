const STEPS: readonly (readonly [number, string])[] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/**
 * Says an amount of money in dollars, shortened the way a headline would: `$165M`, `$1.2B`.
 *
 * Shortened here rather than by `Intl`'s compact notation, which the phone's and the television's
 * JavaScript engine does not implement: it ignored the notation, kept the one decimal, and said a
 * budget of forty million as `$40,000,000.0`.
 *
 * @param amount - How many dollars.
 * @returns The amount, shortened.
 */
const formatMoney = (amount: number): string => {
  const sign = amount < 0 ? '-' : '';
  const size = Math.abs(amount);
  const step = STEPS.find(([from]) => size >= from);

  if (step === undefined) {
    return `${sign}$${Math.round(size).toString()}`;
  }

  const [from, suffix] = step;
  const shortened = Math.round((size / from) * 10) / 10;

  return `${sign}$${shortened.toString()}${suffix}`;
};

export { formatMoney };
