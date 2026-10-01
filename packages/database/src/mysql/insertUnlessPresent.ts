import { getTableColumns, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { IndexColumn, MySqlInsertValue, MySqlTable } from 'drizzle-orm/mysql-core';
import type { AnyDatabase } from './AnyDatabase';
import { upsert } from './upsert';

/**
 * Writes a row unless one already holds its unique key, leaving that one as it was by setting a
 * column to itself rather than with `insert ignore`, which would also swallow a broken foreign key.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The rows to write, one or more.
 * @param target - The columns of the unique key that decide whether a row is already there.
 * @param targetWhere - The condition of a partial unique index, where the key is one.
 */
const insertUnlessPresent = async <T extends MySqlTable>(
  db: AnyDatabase,
  table: T,
  {
    values,
    target,
    targetWhere,
  }: {
    values: MySqlInsertValue<T>[];
    target: IndexColumn | IndexColumn[];
    targetWhere?: SQL;
  },
): Promise<void> => {
  const [kept] = Object.entries(getTableColumns(table));

  if (kept === undefined) {
    throw new Error('insertUnlessPresent needs a table with a column');
  }

  const [field, column] = kept;

  await upsert<MySqlTable>(db, table, {
    values,
    target,
    set: { [field]: sql`${column}` },
    ...(targetWhere === undefined ? {} : { targetWhere }),
  });
};

export { insertUnlessPresent };
