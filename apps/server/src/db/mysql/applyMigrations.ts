import { migrate } from 'drizzle-orm/mysql2/migrator';
import type { ValenceDatabase } from '@ValenceServer/db/mysql/ValenceDatabase';

/**
 * Runs the migrations drizzle finds pending, from the folder holding this dialect's.
 *
 * @param db - The database to bring up to date.
 * @param folder - The directory holding the migrations and their journal.
 */
const applyMigrations = (db: ValenceDatabase, folder: string): Promise<void> =>
  migrate(db, { migrationsFolder: folder });

export { applyMigrations };
