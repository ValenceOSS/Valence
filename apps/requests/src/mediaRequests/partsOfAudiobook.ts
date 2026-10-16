/* oxlint-disable valence/no-hard-coded-strings -- words file names use for a part, matched rather than shown */
const OF = /(\d{1,3})\s*(?:of|\/)\s*(\d{1,3})/i;

const NAMED = /\b(?:part|pt|chapter|ch|track|disc|cd)[\s._-]*(\d{1,3})\b/i;

const LEADING = /^\s*(\d{1,3})(?!\d)/;

const TRAILING = /(?<!\d)(\d{1,3})\s*$/;

const FEWEST_TO_JUDGE = 2;

/**
 * How many parts an audiobook in several files has, and which are missing: each file's number read
 * from its name — "3 of 12", "Part 3", or a number at its start or end — and any number from one to
 * the last, or to the total a name gives, with no file is missing. Nothing is said to be missing
 * where the names cannot all be numbered, or two share a number, as discs each counted from one do.
 *
 * @param names - The audiobook's files, by name without their extension.
 * @returns How many parts it has, and the numbers of those missing.
 */
const partsOfAudiobook = (names: readonly string[]): { count: number; missing: number[] } => {
  const read = names.map((name) => {
    const counted = OF.exec(name);

    if (counted?.[1] !== undefined && counted[2] !== undefined) {
      return { number: Number(counted[1]), total: Number(counted[2]) };
    }

    const found = NAMED.exec(name) ?? LEADING.exec(name) ?? TRAILING.exec(name);

    return found?.[1] === undefined ? null : { number: Number(found[1]), total: null };
  });
  const numbers = read.flatMap((one) => (one === null ? [] : [one.number]));

  if (
    names.length < FEWEST_TO_JUDGE ||
    numbers.length !== names.length ||
    new Set(numbers).size !== numbers.length ||
    numbers.includes(0)
  ) {
    return { count: names.length, missing: [] };
  }

  const totals = read.flatMap((one) => (one?.total === null || one === null ? [] : [one.total]));
  const count = Math.max(...numbers, ...totals);

  return {
    count,
    missing: Array.from({ length: count }, (_unused, at) => at + 1).filter(
      (number) => !numbers.includes(number),
    ),
  };
};

export { partsOfAudiobook };
