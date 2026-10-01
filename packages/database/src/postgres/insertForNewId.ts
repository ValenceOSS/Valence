import { z } from 'zod';
import type { PgColumn, PgInsertValue, PgTable } from 'drizzle-orm/pg-core';
import type { AnyDatabase } from '#dialect/AnyDatabase';

const NEW_ID = z.tuple([z.object({ id: z.number() })]);

/**
 * Writes one row whose id the database numbers itself, and hands back the number it gave. Postgres
 * says it through `returning`; MySQL has no `returning` and reads the connection's last insert id,
 * so query code asks here rather than spelling either.
 *
 * @param db - The database.
 * @param table - The table.
 * @param values - The row to write.
 * @param id - The column the database numbers.
 * @returns The id the new row was given.
 */
const insertForNewId = async <T extends PgTable>(
  db: AnyDatabase,
  table: T,
  values: PgInsertValue<T>,
  id: PgColumn,
): Promise<number> => {
  const [made] = NEW_ID.parse(await db.insert(table).values(values).returning({ id }));

  return made.id;
};

export { insertForNewId };
