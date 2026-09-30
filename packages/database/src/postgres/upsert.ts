import type { SQL } from 'drizzle-orm';
import type { IndexColumn, PgInsertValue, PgTable, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { AnyDatabase } from '#dialect/AnyDatabase';

/**
 * Writes a row, or changes the one already holding its unique key, in the one statement each
 * database has for it. Written here rather than inline so query code never names Postgres's
 * `on conflict`, which MySQL spells differently.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The rows to write, one or more.
 * @param target - The columns of the unique key that decide whether a row is already there.
 * @param set - What to change on a row that was already there.
 * @param targetWhere - The condition of a partial unique index, where the key is one. MySQL has no
 *   partial indexes and ignores it; the key there is the same one, NULLs being distinct.
 */
const upsert = async <T extends PgTable>(
  db: AnyDatabase,
  table: T,
  {
    values,
    target,
    set,
    targetWhere,
  }: {
    values: PgInsertValue<T>[];
    target: IndexColumn | IndexColumn[];
    set: PgUpdateSetSource<T>;
    targetWhere?: SQL;
  },
): Promise<void> => {
  await db
    .insert(table)
    .values(values)
    .onConflictDoUpdate({ target, set, ...(targetWhere === undefined ? {} : { targetWhere }) });
};

export { upsert };
