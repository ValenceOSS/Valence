const FRACTIONS: readonly (readonly [share: number, words: string])[] = [
  [1, 'about the same size as the original'],
  [3 / 4, 'about three-quarters of the original'],
  [2 / 3, 'about two-thirds of the original'],
  [1 / 2, 'about half the size of the original'],
  [1 / 3, 'about a third of the original'],
  [1 / 4, 'about a quarter of the original'],
  [1 / 5, 'about a fifth of the original'],
  [1 / 6, 'about a sixth of the original'],
  [1 / 7, 'about a seventh of the original'],
  [1 / 8, 'about an eighth of the original'],
  [1 / 9, 'about a ninth of the original'],
  [1 / 10, 'about a tenth of the original'],
];

const A_LOT_SMALLER = 10;

/**
 * How a rung's size reads against the file it came from.
 *
 * A number on its own is hard to weigh. Four gigabytes is either most of a phone or nothing at all,
 * depending on what it replaced — and the comparison is the whole point of the menu, since somebody
 * opening it is choosing between these and not judging each on its own.
 *
 * It matters most for a remux, where the arithmetic is the argument: a sixty gigabyte file offered
 * at four is a fifteenth of the size, and saying so makes the case better than either figure does.
 *
 * The nearest named share is the one said, so two-thirds of the file is not rounded down to half
 * of it.
 *
 * @param bytes - What the rung would cost.
 * @param originalBytes - What the file itself costs.
 * @returns The comparison in words, or nothing where there is nothing to compare against.
 */
const compareToOriginal = (bytes: number, originalBytes: number): string | null => {
  if (bytes <= 0 || originalBytes <= 0 || bytes >= originalBytes) {
    return null;
  }

  const times = Math.round(originalBytes / bytes);

  if (times >= A_LOT_SMALLER) {
    return `a small fraction of the original — about a ${times.toString()}th`;
  }

  const share = bytes / originalBytes;
  const nearest = FRACTIONS.reduce((best, candidate) =>
    Math.abs(candidate[0] - share) < Math.abs(best[0] - share) ? candidate : best,
  );

  return nearest[1];
};

export { compareToOriginal };
