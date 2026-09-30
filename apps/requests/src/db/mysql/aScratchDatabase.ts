import { join } from 'node:path';
import { createConnection } from 'mysql2/promise';
import { onTestFinished } from 'vitest';
import { z } from 'zod';
import { scratchDatabaseName } from '@ValenceDatabase/mysql/scratchDatabaseName';
import { applyMigrations } from '@ValenceRequests/db/mysql/applyMigrations';
import { createDatabase } from '@ValenceRequests/db/mysql/createDatabase';
import { readConnectionOptions } from '@ValenceRequests/db/mysql/connection/readConnectionOptions';
import type { RequestsDatabase } from '@ValenceRequests/db/mysql/RequestsDatabase';

const VersionSchema = z.tuple([z.object({ version: z.string() })]);

/**
 * A MySQL or MariaDB database of its own on the server `MYSQL_TEST_URL` names, migrated exactly as
 * the service migrates a real one and dropped when the test is done — so a test of what is kept
 * reads and writes real tables, and a migration that does not apply fails a test rather than a
 * first start.
 *
 * @returns The database.
 */
const aScratchDatabase = async (): Promise<RequestsDatabase> => {
  const server = process.env.MYSQL_TEST_URL;

  if (server === undefined || server === '') {
    throw new Error(
      'MYSQL_TEST_URL is not set. Point it at a MySQL or MariaDB server the tests may create databases on, such as mysql://root:valence@127.0.0.1:3307.',
    );
  }

  const name = scratchDatabaseName();
  const admin = await createConnection(readConnectionOptions(server));
  const [rows] = await admin.query('select version() as version');
  const [{ version }] = VersionSchema.parse(rows);
  const collation = version.includes('MariaDB') ? 'utf8mb4_nopad_bin' : 'utf8mb4_0900_bin';

  await admin.query(`create database \`${name}\` character set utf8mb4 collate ${collation}`);

  const address = new URL(server);
  address.pathname = `/${name}`;
  const { db, pool } = createDatabase(address.toString());

  onTestFinished(async () => {
    await pool.end();
    await admin.query(`drop database \`${name}\``);
    await admin.end();
  });

  await applyMigrations(db, join(import.meta.dirname, '..', '..', '..', 'drizzle', 'mysql'));

  return db;
};

export { aScratchDatabase };
