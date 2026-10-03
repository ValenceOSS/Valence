import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { aPreparedPGlite } from '@ValenceDatabase/postgres/aPreparedPGlite';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';
import type { RequestsDatabase } from '@ValenceRequests/db/postgres/RequestsDatabase';

const MIGRATIONS = join(import.meta.dirname, '..', '..', '..', 'drizzle', 'postgres');

/**
 * A Postgres of its own, in memory, migrated exactly as the service migrates a real one — so a test
 * of what is kept reads and writes real tables, and a migration that does not apply fails a test
 * rather than a first start. The migrations run once, and every database after that starts from a
 * copy of the result.
 *
 * @returns The database.
 */
const aScratchDatabase = async (): Promise<RequestsDatabase> => {
  const files = (await readdir(MIGRATIONS, { recursive: true })).toSorted();
  const recipe = await Promise.all(
    files
      .filter((file) => file.endsWith('.sql') || file.endsWith('_journal.json'))
      .map(async (file) => `${file}\n${await readFile(join(MIGRATIONS, file), 'utf8')}`),
  );
  const client = await aPreparedPGlite('requests', recipe.join('\n'), async (empty) => {
    await migrate(drizzle(empty), {
      migrationsFolder: MIGRATIONS,
      migrationsSchema: 'valence_requests',
      migrationsTable: '__migrations',
    });
  });

  return drizzle(client, { schema: REQUESTS_SCHEMA });
};

export { aScratchDatabase };
