import { getTableColumns, getTableName, is } from 'drizzle-orm';
import { MySqlColumn, getTableConfig } from 'drizzle-orm/mysql-core';
import type { SQL } from 'drizzle-orm';
import type {
  IndexColumn,
  MySqlInsertValue,
  MySqlTable,
  MySqlUpdateSetSource,
} from 'drizzle-orm/mysql-core';
import type { AnyDatabase } from './AnyDatabase';

type KeyField = { column: string; field: string; hasDefault: boolean };

type TableKeys = { primary: KeyField[]; unique: KeyField[][] };

const KEYS = new WeakMap<MySqlTable, TableKeys>();

const HASH = /Hash$/;

/**
 * Writes a row, or changes the one already holding its unique key, with MySQL's `on duplicate key
 * update`, refusing where another unique key could clash since that statement fires on any of them.
 *
 * @param table - The table the key belongs to.
 * @param column - One part of the key.
 * @returns The column's name.
 */
const nameOf = (table: MySqlTable, column: IndexColumn): string => {
  if (!is(column, MySqlColumn)) {
    throw new Error(`upsert into ${getTableName(table)} can only be keyed by columns`);
  }

  return column.name;
};

/**
 * Reads the primary key and the unique keys of a table, once for each table. A key on a generated
 * `…Hash` column, which is how a unique key holds text too long for MySQL to index whole, is read
 * as the key on the column it hashes, which is the one query code names.
 *
 * @param table - The table.
 * @returns Its keys, each as the columns it is made of.
 */
const keysOf = (table: MySqlTable): TableKeys => {
  const known = KEYS.get(table);

  if (known !== undefined) {
    return known;
  }

  const config = getTableConfig(table);
  const fields = new Map(
    Object.entries(getTableColumns(table)).map(([field, column]) => [
      column.name,
      { column: column.name, field, hasDefault: column.hasDefault },
    ]),
  );
  const hashed = new Map(
    config.columns
      .filter((column) => column.generated !== undefined && HASH.test(column.name))
      .map((column) => [column.name, column.name.replace(HASH, '')]),
  );
  const keyOf = (columns: IndexColumn[]): KeyField[] =>
    columns.map((column) => {
      const name = hashed.get(nameOf(table, column)) ?? nameOf(table, column);

      return fields.get(name) ?? { column: name, field: name, hasDefault: false };
    });
  const keys = {
    primary: keyOf(
      config.primaryKeys[0]?.columns ?? config.columns.filter((column) => column.primary),
    ),
    unique: [
      ...config.indexes
        .filter((index) => index.config.unique)
        .map((index) => keyOf(index.config.columns)),
      ...config.uniqueConstraints.map((constraint) => keyOf(constraint.columns)),
      ...config.columns.filter((column) => column.isUnique).map((column) => keyOf([column])),
    ],
  };

  KEYS.set(table, keys);

  return keys;
};

/**
 * Tells whether two keys are made of the same columns, in any order.
 *
 * @param one - One key.
 * @param other - The other.
 * @returns Whether they are the same key.
 */
const isSameKey = (one: KeyField[], other: string[]): boolean =>
  one.length === other.length && one.every((part) => other.includes(part.column));

/**
 * Tells whether a row could clash on a key, which it cannot where it leaves one of the key's
 * columns empty, since MySQL holds no two NULLs equal.
 *
 * @param row - The row being written.
 * @param key - The key.
 * @returns Whether the row fills every column of the key.
 */
const fillsKey = <T extends MySqlTable>(row: MySqlInsertValue<T>, key: KeyField[]): boolean => {
  const values = new Map(Object.entries(row));

  return key.every((part) => {
    const value = values.get(part.field);

    return value === undefined ? part.hasDefault : value !== null;
  });
};

/**
 * Refuses an upsert that MySQL could apply to the wrong row: `on duplicate key update` fires on
 * any unique key, not the one named, so every other unique key must be one these rows cannot fill.
 *
 * @param table - The table.
 * @param target - The key the upsert is meant to be decided by.
 * @param values - The rows being written.
 */
const assertOnlyTargetCanClash = <T extends MySqlTable>(
  table: T,
  target: IndexColumn | IndexColumn[],
  values: MySqlInsertValue<T>[],
): void => {
  const keys = keysOf(table);
  const wanted = (Array.isArray(target) ? target : [target]).map((column) => nameOf(table, column));
  const isPrimary = isSameKey(keys.primary, wanted);

  if (!isPrimary && !keys.unique.some((key) => isSameKey(key, wanted))) {
    throw new Error(
      `upsert into ${getTableName(table)} by (${wanted.join(', ')}), which is not one of its unique keys`,
    );
  }

  const clashing = keys.unique.find(
    (key) => !isSameKey(key, wanted) && values.some((row) => fillsKey(row, key)),
  );

  if (clashing !== undefined) {
    throw new Error(
      `upsert into ${getTableName(table)} by (${wanted.join(', ')}) could also clash on (${clashing.map((part) => part.column).join(', ')}), and MySQL would change that row instead`,
    );
  }
};

/**
 * Writes a row, or changes the one already holding its unique key, in the one statement each
 * database has for it. Written here rather than inline so query code never names MySQL's
 * `on duplicate key update`, which Postgres spells differently.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The rows to write, one or more.
 * @param target - The columns of the unique key that decide whether a row is already there.
 * @param set - What to change on a row that was already there.
 * @param targetWhere - The condition of a partial unique index, where the key is one. MySQL has no
 *   partial indexes and ignores it; the key there is the same one, NULLs being distinct.
 */
const upsert = async <T extends MySqlTable>(
  db: AnyDatabase,
  table: T,
  {
    values,
    target,
    set,
  }: {
    values: MySqlInsertValue<T>[];
    target: IndexColumn | IndexColumn[];
    set: MySqlUpdateSetSource<T>;
    targetWhere?: SQL;
  },
): Promise<void> => {
  assertOnlyTargetCanClash(table, target, values);

  await db.insert(table).values(values).onDuplicateKeyUpdate({ set });
};

export { upsert };
