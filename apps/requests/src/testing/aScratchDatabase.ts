import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { schema } from '@ValenceRequests/db/Database';
import type { RequestsDatabase } from '@ValenceRequests/db/Database';

/**
 * A Postgres of its own, in memory, migrated exactly as the service migrates a real one — so a test
 * of what is kept reads and writes real tables, and a migration that does not apply fails a test
 * rather than a first start.
 *
 * @returns The database.
 */
const aScratchDatabase = async (): Promise<RequestsDatabase> => {
  const db = drizzle(new PGlite(), { schema });

  await migrate(db, {
    migrationsFolder: join(import.meta.dirname, '..', '..', 'drizzle'),
    migrationsSchema: 'valence_requests',
    migrationsTable: '__migrations',
  });

  return db;
};

export { aScratchDatabase };
