/**
 * Finds a publication year in a book's file name, bracketed or bare, ignoring numbers that cannot
 * be one — a volume count, a year before print as it is sold now.
 *
 * @param text - The file name to read.
 * @returns The year and where it starts, or null where the name gives none.
 */
const findYear = (text: string): { year: number; index: number } | null => {
  const matches = [...text.matchAll(/(?<open>[([])?\b(?<year>19\d{2}|20\d{2})\b\)?]?/g)];
  const yearMatch =
    matches.find((match) => match.groups?.open !== undefined) ?? matches[matches.length - 1];

  return yearMatch?.groups?.year === undefined
    ? null
    : { year: Number(yearMatch.groups.year), index: yearMatch.index };
};

export { findYear };
