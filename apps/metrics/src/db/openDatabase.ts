import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { dailyInstalls, installs } from './Schema';
import type { MetricsSchema } from './MetricsDatabase';

let opened: PostgresJsDatabase<MetricsSchema> | null = null;

/**
 * Connects to the database named by `DATABASE_URL`, once per process, and hands back the same
 * connection on every call after.
 *
 * @returns The database.
 */
const openDatabase = (): PostgresJsDatabase<MetricsSchema> => {
  if (opened !== null) {
    return opened;
  }

  const url = process.env.DATABASE_URL ?? '';

  if (url === '') {
    throw new Error('DATABASE_URL is not set, so there is no database to keep the reports in.');
  }

  opened = drizzle(postgres(url, { max: 10, onnotice: () => undefined }), {
    schema: { installs, dailyInstalls },
  });

  return opened;
};

export { openDatabase };
