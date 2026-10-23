import { readNumber } from '@ValenceRequests/cardigann/readNumber';

const POWERS: Readonly<Record<string, number>> = { k: 1, m: 2, g: 3, t: 4 };

const FIRST_NUMBER = /\d{1,3}(?:[ \u00a0]\d{3})+(?![\d.,])|\d[\d.,]*/u;

const UNIT_AFTER = /^\s*(?:([kmgt])i?[bo]\b|bytes?\b|octets?\b|[bo]\b)/iu;

/**
 * Reads a size as a site wrote it — "1.4 GB", "700MiB", "1,2 Go", "8000000000" — as bytes, counting
 * in 1024s, which is what every site means whatever it writes.
 *
 * Only the first number counts, and only a unit right after it: a size given as "1.2 GB (1288490188
 * bytes)" is 1.2 gigabytes rather than both numbers run together, and a letter elsewhere in the text
 * is not a unit, where the "t" in "bytes" or "Total" once made a size terabytes.
 *
 * @param text - What the site wrote.
 * @returns The size in bytes, or null where there is none.
 */
const readSize = (text: string): number | null => {
  const found = FIRST_NUMBER.exec(text);

  if (found === null) {
    return null;
  }

  const value = readNumber(found[0].replaceAll(/[ \u00a0]/gu, ''));

  if (value === null) {
    return null;
  }

  const unit = UNIT_AFTER.exec(text.slice(found.index + found[0].length))?.[1]?.toLowerCase();
  const power = unit === undefined ? 0 : (POWERS[unit] ?? 0);

  return Math.round(value * 1024 ** power);
};

export { readSize };
