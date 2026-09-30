import { join } from 'node:path';
import { onTestFinished } from 'vitest';
import { createScratchDatabase } from '@ValenceDatabase/mysql/createScratchDatabase';
import { applyMigrations } from '@ValenceRequests/db/mysql/applyMigrations';
import { createDatabase } from '@ValenceRequests/db/mysql/createDatabase';
import type { RequestsDatabase } from '@ValenceRequests/db/mysql/RequestsDatabase';

/**
 * A MySQL or MariaDB database of its own on the server `MYSQL_TEST_URL` names, migrated exactly as
 * the service migrates a real one and dropped when the test is done — so a test of what is kept
 * reads and writes real tables, and a migration that does not apply fails a test rather than a
 * first start.
 *
 * @returns The database.
 */
const aScratchDatabase = async (): Promise<RequestsDatabase> => {
  const { url, drop } = await createScratchDatabase();
  const { db, pool } = createDatabase(url);

  onTestFinished(async () => {
    await pool.end();
    await drop();
  });

  await applyMigrations(db, join(import.meta.dirname, '..', '..', '..', 'drizzle', 'mysql'));

  return db;
};

export { aScratchDatabase };
