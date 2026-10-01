import { sql } from 'drizzle-orm';
import type { Column, SQL } from 'drizzle-orm';
import type { JsonFieldType } from '@ValenceDatabase/JsonFieldType';

const POSTGRES_TYPES: Record<JsonFieldType, SQL> = {
  text: sql.raw('text'),
  integer: sql.raw('integer'),
  number: sql.raw('double precision'),
  boolean: sql.raw('boolean'),
};

/**
 * Spreads a JSON array of objects into rows, one object each, reading the named fields of each as
 * columns — to join or filter on them like a table. An empty or missing array gives no rows.
 *
 * @param column - The JSON column holding the array.
 * @param alias - What to call the rows in the query.
 * @param fields - The fields to read from each object, and what each holds.
 * @returns The rows to put after `from` or `join`, and a way to name a field on each row.
 */
const jsonObjectElements = (
  column: Column | SQL,
  alias: string,
  fields: Record<string, JsonFieldType>,
): { rows: SQL; field: (name: string) => SQL } => {
  const columns = sql.join(
    Object.entries(fields).map(
      ([name, type]) => sql`${sql.identifier(name)} ${POSTGRES_TYPES[type]}`,
    ),
    sql`, `,
  );

  return {
    rows: sql`jsonb_to_recordset(coalesce(${column}, '[]'::jsonb)) as ${sql.identifier(alias)}(${columns})`,
    field: (name) => sql`${sql.identifier(alias)}.${sql.identifier(name)}`,
  };
};

export { jsonObjectElements };
