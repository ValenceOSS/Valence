import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Spreads a JSON array of strings into rows, one string each, to join or filter on like a table.
 * An empty or missing array gives no rows.
 *
 * @param column - The JSON column holding the array.
 * @param alias - What to call the rows in the query.
 * @returns The rows to put after `from` or `join`, and the string on each row.
 */
const jsonTextElements = (
  column: Column | SQL,
  alias: string,
): { rows: SQL; value: SQL<string> } => ({
  rows: sql`jsonb_array_elements_text(coalesce(${column}, '[]'::jsonb)) as ${sql.identifier(alias)}(value)`,
  value: sql<string>`${sql.identifier(alias)}.value`,
});

export { jsonTextElements };
