const EXACT = 0;

const STARTS = 1;

const WORD_STARTS = 2;

const CONTAINS = 3;

const ELSEWHERE = 4;

/**
 * Folds what was typed and what it is compared with to the same shape: lower case, accents
 * dropped, and runs of spaces made one, so "Amélie" is found by "amelie" and "the  office" by
 * "the office".
 *
 * @param said - The words to fold.
 * @returns The folded words.
 */
const fold = (said: string): string =>
  said
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/gu, ' ')
    .trim();

/**
 * How well a title answers a search, as a rank where lower is better: the title is exactly what was
 * typed, then it starts with it, then one of its words starts with it, then it holds it anywhere,
 * and last, a title that only matched on its description or cast. The best of the names given wins,
 * so an episode is ranked by its series as well as its own title.
 *
 * @param names - The title, and any other name it goes by, such as its series.
 * @param search - What was typed.
 * @returns The rank, from 0 for an exact title to 4 for no match in any name.
 */
const searchRankOf = (names: readonly (string | null | undefined)[], search: string): number => {
  const wanted = fold(search);

  if (wanted === '') {
    return ELSEWHERE;
  }

  return names.reduce<number>((best, name) => {
    if (name === null || name === undefined) {
      return best;
    }

    const folded = fold(name);
    const rank =
      folded === wanted
        ? EXACT
        : folded.startsWith(wanted)
          ? STARTS
          : folded.includes(` ${wanted}`)
            ? WORD_STARTS
            : folded.includes(wanted)
              ? CONTAINS
              : ELSEWHERE;

    return Math.min(best, rank);
  }, ELSEWHERE);
};

export { searchRankOf };
