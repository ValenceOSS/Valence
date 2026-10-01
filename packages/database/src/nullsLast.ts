import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Orders by a value with the rows that have none after all the rest, in either direction —
 * Postgres's `nulls last`, which MySQL has no words for.
 *
 * @param value - What to order by.
 * @param direction - Smallest first, or largest first.
 * @returns The ordering, for `orderBy`.
 */
const nullsLast = (value: Column | SQL, direction: 'asc' | 'desc'): SQL =>
  sql`(${value} is null), ${value} ${sql.raw(direction)}`;

export { nullsLast };
