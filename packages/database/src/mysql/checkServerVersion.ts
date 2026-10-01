import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { readRows } from './readRows';
import { serverProblem } from './serverProblem';
import type { AnyDatabase } from './AnyDatabase';

const ServerSchema = z.object({
  version: z.string(),
  collation: z.string(),
  database: z.string(),
});

/**
 * Asks the database server whether it can hold Valence's data before anything is migrated, so a
 * server too old or a database in the wrong collation stops the start with what to do about it.
 *
 * @param db - The database.
 * @throws If the server or the database will not do.
 */
const checkServerVersion = async (db: AnyDatabase): Promise<void> => {
  const [server] = await readRows(
    db,
    sql`select version() as version, @@collation_database as collation, database() as ${sql.identifier('database')}`,
    ServerSchema,
  );
  const problem = server === undefined ? null : serverProblem(server);

  if (problem !== null) {
    throw new Error(problem);
  }
};

export { checkServerVersion };
