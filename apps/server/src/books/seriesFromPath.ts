import { relative, sep } from 'node:path';

type InSeries = { name: string; position: number | null };

const NUMBERED = /^(?:(?:book|vol(?:ume)?|part)\.?\s*)?(\d+(?:\.\d+)?)\s*(?:[-–—.:)]\s*|\s+)(.+)$/i;

/**
 * Where a book sits in a series, as the folders it is kept in say, the way audiobook servers lay a
 * library out: `Author/Series/1 - Title`, the series being the folder around the book's own and
 * the number its place. A book three folders down with no number is still in the series around it,
 * with no place; a book in its author's folder, or at the top, is in none.
 *
 * @param root - The library.
 * @param bookPath - The book's folder.
 * @returns The series and the book's place in it, and the book's title without its number, or
 *   nothing where the folders say it is in no series.
 */
const seriesFromPath = (
  root: string,
  bookPath: string,
): { series: InSeries; title: string } | null => {
  const parts = relative(root, bookPath)
    .split(sep)
    .filter((part) => part !== '' && part !== '.');
  const own = parts.at(-1);
  const around = parts.at(-2);

  if (own === undefined || around === undefined || parts[0] === '..') {
    return null;
  }

  const numbered = NUMBERED.exec(own);

  if (numbered?.[1] !== undefined && numbered[2] !== undefined) {
    return {
      series: { name: around, position: Number(numbered[1]) },
      title: numbered[2].trim(),
    };
  }

  return parts.length >= 3 ? { series: { name: around, position: null }, title: own } : null;
};

export type { InSeries };

export { seriesFromPath };
