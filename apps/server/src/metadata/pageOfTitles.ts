import { z } from 'zod';
import { readJson } from '@ValenceCore/functions/readJson';
import { titlesAsked } from './titlesAsked';
import { valueOfSort } from './valueOfSort';
import { compareSorted } from './compareSorted';
import type { ListedTitle } from './listedTitlesOf';
import type { TitleListQuery, TitlePage } from '@ValenceContracts/schemas/TitleList';

const CursorSchema = z.tuple([z.union([z.string(), z.number()]), z.string()]);

/**
 * Reads where a page left off from the cursor it handed out.
 *
 * @param after - The cursor.
 * @returns The value and key it stopped at, or nothing where it cannot be read.
 */
const readCursor = (after: string | undefined): [string | number, string] | null => {
  if (after === undefined) {
    return null;
  }

  const read = CursorSchema.safeParse(readJson(Buffer.from(after, 'base64url').toString('utf8')));

  return read.success ? read.data : null;
};

/**
 * Lists a page of a library's titles as a listing asks: searched, filtered by its chips and its
 * quick filter, in its order, from where the last page stopped, with how many there are in all and
 * how many each quick filter would show.
 *
 * @param titles - Every title of the library.
 * @param query - The listing asked for.
 * @param after - Where the last page stopped.
 * @param limit - How many to a page.
 * @param now - The time now.
 * @returns The page.
 */
const pageOfTitles = (
  titles: readonly ListedTitle[],
  query: TitleListQuery,
  after: string | undefined,
  limit: number,
  now: number,
): TitlePage => {
  const { counts, shown: sorted } = titlesAsked(titles, query, now);
  const cursor = readCursor(after);
  const start =
    cursor === null
      ? 0
      : sorted.findIndex((title) => {
          const byValue = compareSorted(valueOfSort(title, query.sort), cursor[0]);
          const signed = query.desc ? -byValue : byValue;

          return signed > 0 || (signed === 0 && title.row.key.localeCompare(cursor[1]) > 0);
        });
  const page = start < 0 ? [] : sorted.slice(start, start + limit);
  const last = page.at(-1);
  const hasMore = start >= 0 && start + limit < sorted.length;

  return {
    titles: page.map((title) => title.row),
    next:
      hasMore && last !== undefined
        ? Buffer.from(
            JSON.stringify([valueOfSort(last, query.sort), last.row.key]),
            'utf8',
          ).toString('base64url')
        : null,
    total: sorted.length,
    counts,
  };
};

export { pageOfTitles };
