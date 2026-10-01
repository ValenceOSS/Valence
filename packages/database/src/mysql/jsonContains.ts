import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Tells whether a JSON column holds a value — an element of an array, or the keys and values of an
 * object — the way Postgres's `@>` does and MySQL's `json_contains`.
 *
 * @param column - The JSON column, or an expression that is one.
 * @param value - What it should contain.
 * @returns The condition.
 */
const jsonContains = <T>(column: Column | SQL, value: T): SQL =>
  sql`json_contains(${column}, ${JSON.stringify(value)})`;

export { jsonContains };
