import { getTableColumns } from 'drizzle-orm';
import { incoming } from '@ValenceDatabase/incoming';
import type { Column, SQL, Table } from 'drizzle-orm';

/**
 * What to change on a row already there when the same row is written again: every column but its
 * key, to what was just written. A column the database works out for itself, such as the hash of a
 * long path MySQL keys a table on, is left to it.
 *
 * @param table - The table.
 * @param keys - The columns that make up its key, which are left as they are.
 * @returns The change, for an upsert's `set`.
 */
const setEverythingFrom = (table: Table, keys: readonly string[]): Record<string, SQL> => {
  const columns: Record<string, Column> = getTableColumns(table);

  return Object.fromEntries(
    Object.entries(columns)
      .filter(([name, column]) => !keys.includes(name) && column.generated === undefined)
      .map(([name, column]) => [name, incoming(column)]),
  );
};

export { setEverythingFrom };
