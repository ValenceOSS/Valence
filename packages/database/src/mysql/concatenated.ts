import { sql } from 'drizzle-orm';
import type { SQL, SQLWrapper } from 'drizzle-orm';

/**
 * Joins pieces of text into one with `concat_ws`, which reads a missing piece as empty text where
 * MySQL's `concat` would make the whole thing missing.
 *
 * @param parts - The pieces, in order.
 * @returns The joined text.
 */
const concatenated = (...parts: (SQLWrapper | string)[]): SQL<string> =>
  sql<string>`concat_ws('', ${sql.join(
    parts.map((part) => sql`${part}`),
    sql`, `,
  )})`;

export { concatenated };
