import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import type { MetricsDatabase } from '@ValenceMetrics/db/MetricsDatabase';

const MIGRATIONS = fileURLToPath(new URL('../../drizzle/postgres', import.meta.url));

/**
 * A Postgres of its own, in memory, brought up to date by every migration the site ships, so a
 * query can be tried against the tables it really runs on.
 *
 * @returns The database.
 */
const aMigratedDatabase = async (): Promise<MetricsDatabase> => {
  const db = drizzle(new PGlite(), { schema: { installs, dailyInstalls } });

  await migrate(db, { migrationsFolder: MIGRATIONS });

  return db;
};

export { aMigratedDatabase };
