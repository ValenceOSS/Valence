import { sql } from 'drizzle-orm';
import type { SQL, SQLWrapper } from 'drizzle-orm';

/**
 * Joins pieces of text into one — in place of `||`, which MySQL reads as "or". A missing piece is
 * treated as empty text rather than making the whole thing missing.
 *
 * @param parts - The pieces, in order.
 * @returns The joined text.
 */
const concatenated = (...parts: (SQLWrapper | string)[]): SQL<string> =>
  sql<string>`concat(${sql.join(
    parts.map((part) => (typeof part === 'string' ? sql`${part}::text` : sql`${part}`)),
    sql`, `,
  )})`;

export { concatenated };
