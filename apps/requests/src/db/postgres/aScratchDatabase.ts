import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';
import type { RequestsDatabase } from '@ValenceRequests/db/postgres/RequestsDatabase';

/**
 * A Postgres of its own, in memory, migrated exactly as the service migrates a real one — so a test
 * of what is kept reads and writes real tables, and a migration that does not apply fails a test
 * rather than a first start.
 *
 * @returns The database.
 */
const aScratchDatabase = async (): Promise<RequestsDatabase> => {
  const db = drizzle(new PGlite(), { schema: REQUESTS_SCHEMA });

  await migrate(db, {
    migrationsFolder: join(import.meta.dirname, '..', '..', '..', 'drizzle', 'postgres'),
    migrationsSchema: 'valence_requests',
    migrationsTable: '__migrations',
  });

  return db;
};

export { aScratchDatabase };
