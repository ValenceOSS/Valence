import { z } from 'zod';
import type { SQL } from 'drizzle-orm';
import type { AnyDatabase } from './AnyDatabase';

/**
 * Runs a query written by hand and reads its rows through a schema, since each driver hands them
 * back in a different wrapper and none of them says what the rows hold.
 *
 * @param db - The database.
 * @param query - The query.
 * @param row - What each row holds.
 * @returns The rows.
 */
const readRows = async <S extends z.ZodType>(
  db: AnyDatabase,
  query: SQL,
  row: S,
): Promise<z.infer<S>[]> =>
  z.tuple([z.array(row), z.array(z.object({}))]).parse(await db.execute(query))[0];

export { readRows };
