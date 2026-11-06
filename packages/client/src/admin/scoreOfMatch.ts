const ARTICLE = /^(?:the|a|an) /u;

/**
 * Brings a title down to its words, so accents, case, punctuation, "&" against "and" and a
 * leading article cannot make two spellings of it look different.
 *
 * @param title - The title as written.
 * @returns Its words.
 */
const wordsOf = (title: string): string[] =>
  title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase()
    .replaceAll('&', ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(ARTICLE, '')
    .split(' ')
    .filter((word) => word !== '');

/**
 * How well a catalogue entry fits the title being matched, out of a hundred: how many words their
 * names share, and, where the title's year is known, how close the entry's is, a year either side
 * counting for half since release dates straddle a new year from one country to the next.
 *
 * @param wanted - The title being matched, and its year where known.
 * @param found - The catalogue entry, and its year where known.
 * @returns The fit, from 0 to 100.
 */
const scoreOfMatch = (
  wanted: { title: string; year: number | null },
  found: { title: string; year: number | null },
): number => {
  const asked = wordsOf(wanted.title);
  const named = wordsOf(found.title);
  const shared = asked.filter((word) => named.includes(word)).length;
  const names =
    asked.length + named.length === 0 ? 0 : (2 * shared) / (asked.length + named.length);

  if (wanted.year === null) {
    return Math.round(names * 100);
  }

  const apart = found.year === null ? null : Math.abs(found.year - wanted.year);
  const years = apart === 0 ? 1 : apart === 1 ? 0.5 : 0;

  return Math.round(names * 80 + years * 20);
};

export { scoreOfMatch };
