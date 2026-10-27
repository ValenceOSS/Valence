import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';
import { concatenated } from '@ValenceDatabase/concatenated';

/**
 * A key to order rows by that shuffles them one way for a list all day, and another the next.
 *
 * @param column - What tells the rows apart.
 * @param listId - The list being shuffled.
 * @param now - The time, whose day picks the shuffle.
 * @returns The key, as a value the query can order by.
 */
const shuffledBy = (column: Column, listId: string, now: Date): SQL<string> =>
  sql<string>`md5(${concatenated(column, `${listId}:${now.toISOString().slice(0, 10)}`)})`;

export { shuffledBy };
