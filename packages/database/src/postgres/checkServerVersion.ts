import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { say } from '@ValenceI18n/say';
import { readRows } from './readRows';
import type { AnyDatabase } from './AnyDatabase';

const LOWEST = 150_000;

const ServerSchema = z.object({ number: z.coerce.number(), version: z.string() });

/**
 * Asks Postgres whether it is new enough for Valence before anything is migrated, so a server too
 * old stops the start with its version rather than failing on some query later.
 *
 * @param db - The database.
 * @throws If the server is older than Postgres 15.
 */
const checkServerVersion = async (db: AnyDatabase): Promise<void> => {
  const [server] = await readRows(
    db,
    sql`select current_setting('server_version_num') as number, current_setting('server_version') as version`,
    ServerSchema,
  );

  if (server !== undefined && server.number < LOWEST) {
    throw new Error(say('database.postgresTooOld', { version: server.version }));
  }
};

export { checkServerVersion };
