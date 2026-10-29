import { join } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { openDatabase } from './openDatabase';

/**
 * Brings the database up to date with every migration shipped beside the app, as it starts.
 *
 * @returns Once every migration has been applied.
 */
const migrateDatabase = async (): Promise<void> => {
  await migrate(openDatabase(), {
    migrationsFolder: process.env.METRICS_MIGRATIONS ?? join(process.cwd(), 'drizzle', 'postgres'),
  });
};

export { migrateDatabase };
