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
  rows: sql`json_table(coalesce(${column}, json_array()), '$[*]' columns (${sql.identifier('value')} text path '$')) as ${sql.identifier(alias)}`,
  value: sql<string>`${sql.identifier(alias)}.${sql.identifier('value')}`,
});

export { jsonTextElements };
