import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/pglite';
import { z } from 'zod';
import { aPreparedPGlite } from '@ValenceDatabase/postgres/aPreparedPGlite';
import { authSchema, valenceSchema } from '@ValenceServer/db/postgres/Schema';

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/postgres/', import.meta.url));

const JournalSchema = z.object({ entries: z.array(z.object({ tag: z.string() })) });

/**
 * A Postgres of its own, in memory, brought up to date by every migration the server ships, in the
 * order its journal lists them, so a store can be tried against the tables it really runs on. The
 * migrations run once, and every database after that starts from a copy of the result.
 *
 * @returns The database.
 */
const aMigratedDatabase = async () => {
  const journal = JournalSchema.parse(
    JSON.parse(await readFile(`${MIGRATIONS}meta/_journal.json`, 'utf8')),
  );
  const migrations = await Promise.all(
    journal.entries.map(({ tag }) => readFile(`${MIGRATIONS}${tag}.sql`, 'utf8')),
  );
  const client = await aPreparedPGlite('server', migrations.join('\n'), async (empty) => {
    for (const sql of migrations) {
      await empty.exec(sql);
    }
  });

  return drizzle(client, { schema: { ...authSchema, ...valenceSchema } });
};

export { aMigratedDatabase };
