import { drizzle } from 'drizzle-orm/mysql2';
import { DEFAULT_CONNECTION } from '@ValenceDatabase/DEFAULT_CONNECTION';
import type { DatabaseConnection } from '@ValenceDatabase/DatabaseConnection';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/mysql/REQUESTS_SCHEMA';
import { openPool } from '@ValenceDatabase/mysql/connection/openPool';

/**
 * Opens the connection pool and binds the service's own tables to it.
 *
 * @param databaseUrl - Where MySQL or MariaDB is.
 * @param connection - How many connections the pool may hold, and whether they use TLS.
 * @returns The database, ready to query.
 */
const createDatabase = (
  databaseUrl: string,
  connection: DatabaseConnection = DEFAULT_CONNECTION,
) => {
  const pool = openPool(databaseUrl, connection);
  const db = drizzle(pool, { schema: REQUESTS_SCHEMA, mode: 'default' });

  return { db, pool };
};

export { createDatabase };
