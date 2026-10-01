import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';

/**
 * Runs the migrations drizzle finds pending, keeping the service's ledger in its own schema.
 *
 * @param db - The database to bring up to date.
 * @param folder - The directory holding this dialect's migrations and their journal.
 */
const applyMigrations = (
  db: NodePgDatabase<typeof REQUESTS_SCHEMA>,
  folder: string,
): Promise<void> =>
  migrate(db, {
    migrationsFolder: folder,
    migrationsSchema: 'valence_requests',
    migrationsTable: '__migrations',
  });

export { applyMigrations };
