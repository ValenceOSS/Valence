import type { MySqlColumn, MySqlInsertValue, MySqlTable } from 'drizzle-orm/mysql-core';
import type { AnyDatabase } from './AnyDatabase';

/**
 * Writes one row whose `auto_increment` id the database numbers itself, and hands back the number
 * from the result's last insert id, since MySQL has no `returning`.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The row to write.
 * @param id - The column the database numbers.
 * @returns The id the new row was given.
 */
const insertForNewId = async <T extends MySqlTable>(
  db: AnyDatabase,
  table: T,
  values: MySqlInsertValue<T>,
  id: MySqlColumn,
): Promise<number> => {
  if (!('autoIncrement' in id) || id.autoIncrement !== true) {
    throw new Error(`insertForNewId needs the column MySQL numbers itself; ${id.name} is not one`);
  }

  const [header] = await db.insert(table).values(values);

  return header.insertId;
};

export { insertForNewId };
