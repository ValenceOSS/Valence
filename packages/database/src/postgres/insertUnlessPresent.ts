import type { SQL } from 'drizzle-orm';
import type { IndexColumn, PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import type { AnyDatabase } from '#dialect/AnyDatabase';

/**
 * Writes a row unless one already holds its unique key, leaving that one as it was. Never
 * `insert ignore` on MySQL, which would also swallow a broken foreign key or a value too long.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The rows to write, one or more.
 * @param target - The columns of the unique key that decide whether a row is already there.
 * @param targetWhere - The condition of a partial unique index, where the key is one.
 */
const insertUnlessPresent = async <T extends PgTable>(
  db: AnyDatabase,
  table: T,
  {
    values,
    target,
    targetWhere,
  }: {
    values: PgInsertValue<T>[];
    target: IndexColumn | IndexColumn[];
    targetWhere?: SQL;
  },
): Promise<void> => {
  await db
    .insert(table)
    .values(values)
    .onConflictDoNothing({ target, ...(targetWhere === undefined ? {} : { where: targetWhere }) });
};

export { insertUnlessPresent };
