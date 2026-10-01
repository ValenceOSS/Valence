import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { z } from 'zod';
import { authSchema, valenceSchema } from '@ValenceServer/db/postgres/Schema';

const MIGRATIONS = fileURLToPath(new URL('../../../drizzle/postgres/', import.meta.url));

const JournalSchema = z.object({ entries: z.array(z.object({ tag: z.string() })) });

/**
 * A Postgres of its own, in memory, brought up to date by every migration the server ships, in the
 * order its journal lists them, so a store can be tried against the tables it really runs on.
 *
 * @returns The database.
 */
const aMigratedDatabase = async () => {
  const client = new PGlite();
  const journal = JournalSchema.parse(
    JSON.parse(await readFile(`${MIGRATIONS}meta/_journal.json`, 'utf8')),
  );

  for (const { tag } of journal.entries) {
    await client.exec(await readFile(`${MIGRATIONS}${tag}.sql`, 'utf8'));
  }

  return drizzle(client, { schema: { ...authSchema, ...valenceSchema } });
};

export { aMigratedDatabase };
