import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Matches a `LIKE` pattern whatever the case of either side — what Postgres's `ilike` does, written
 * so that every database runs it the same way. Escape any text in the pattern with
 * `likeLiterally` first; the default escape character, `\`, is the same everywhere, so no `escape`
 * clause is written.
 *
 * @param column - What is searched.
 * @param pattern - The pattern, with `%` and `_` where they are meant.
 * @returns The condition.
 */
const containsInsensitively = (column: Column | SQL, pattern: string): SQL =>
  sql`lower(${column}) like lower(${pattern})`;

export { containsInsensitively };
