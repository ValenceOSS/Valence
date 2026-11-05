import { scoreOfMatch } from '@ValenceClient/admin/scoreOfMatch';

const SURE = 90;

const CLEAR_OF_THE_NEXT = 15;

/**
 * Picks the catalogue entry a title is, where one fits it so well and so far ahead of the rest that
 * nobody need look: at least 90 out of a hundred, and fifteen clear of the next.
 *
 * @param wanted - The title, and its year where known.
 * @param found - What the catalogue offered for it.
 * @returns The entry and its score, or nothing where a person should choose.
 */
const bestMatchOf = <Entry extends { title: string; year: number | null }>(
  wanted: { title: string; year: number | null },
  found: readonly Entry[],
): { entry: Entry; score: number } | null => {
  const [best, next] = found
    .map((entry) => ({ entry, score: scoreOfMatch(wanted, entry) }))
    .sort((one, other) => other.score - one.score);

  return best !== undefined &&
    best.score >= SURE &&
    (next === undefined || best.score - next.score >= CLEAR_OF_THE_NEXT)
    ? best
    : null;
};

export { bestMatchOf };
