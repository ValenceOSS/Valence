import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * A column named with its table, for SQL written by hand where a bare name could mean another table.
 *
 * @param column - The column.
 * @returns The column, named with its table.
 */
const qualified = (column: Column): SQL => sql`${column.table}.${sql.identifier(column.name)}`;

export { qualified };
