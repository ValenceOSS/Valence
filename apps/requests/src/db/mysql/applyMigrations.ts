import { migrate } from 'drizzle-orm/mysql2/migrator';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { REQUESTS_SCHEMA } from '@ValenceRequests/db/mysql/REQUESTS_SCHEMA';

/**
 * Runs the migrations drizzle finds pending, keeping the service's ledger in a table of its own
 * beside the server's.
 *
 * @param db - The database to bring up to date.
 * @param folder - The directory holding this dialect's migrations and their journal.
 */
const applyMigrations = (
  db: MySql2Database<typeof REQUESTS_SCHEMA>,
  folder: string,
): Promise<void> =>
  migrate(db, { migrationsFolder: folder, migrationsTable: '__requests_migrations' });

export { applyMigrations };
