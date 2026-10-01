import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * The default of a JSON column as the expression both MySQL and MariaDB accept, since neither
 * takes a bare literal as the default of a JSON column.
 *
 * @param value - The value a row starts with.
 * @returns The default, as SQL for the column's DDL.
 */
const jsonDefault = (value: object): SQL => {
  const literal = JSON.stringify(value).replaceAll("'", "''");

  return sql.raw(`('${literal}')`);
};

export { jsonDefault };
