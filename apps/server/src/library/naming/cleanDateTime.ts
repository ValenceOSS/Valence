import { CLEAN_DATE_TIMES } from './CLEAN_DATE_TIMES';

/**
 * Splits a release year off the end of a name — `Arrival (2016)`, `curse.of.chucky.2013.unrated` —
 * keeping everything before it as the name, the way Jellyfin reads a film's year.
 *
 * A year has to follow at least two characters of name and a separator, so `1917` and
 * `2001 A Space Odyssey` keep their numbers as titles rather than losing them as years.
 *
 * @param name - A file or folder name.
 * @returns The name without its year, and the year where it had one.
 */
const cleanDateTime = (name: string): { name: string; year: number | null } => {
  for (const pattern of CLEAN_DATE_TIMES) {
    const match = pattern.exec(name);
    const year = match?.[2] === undefined ? Number.NaN : Number(match[2]);

    if (match?.[1] !== undefined && Number.isInteger(year)) {
      return { name: match[1].trimEnd(), year };
    }
  }

  return { name, year: null };
};

export { cleanDateTime };
