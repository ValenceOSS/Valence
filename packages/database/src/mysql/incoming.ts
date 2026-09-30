import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';

/**
 * Names the value an upsert was about to write into a column, for a `set` that keeps or combines
 * it: Postgres calls that row `excluded`, MySQL and MariaDB read it with `values()`.
 *
 * @param column - The column.
 * @returns The incoming value, as SQL.
 */
const incoming = (column: Column): SQL => sql`values(${sql.identifier(column.name)})`;

export { incoming };
