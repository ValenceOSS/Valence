import { drizzle } from 'drizzle-orm/mysql2';
import { DEFAULT_CONNECTION } from '@ValenceDatabase/DEFAULT_CONNECTION';
import type { DatabaseConnection } from '@ValenceDatabase/DatabaseConnection';
import { openPool } from '@ValenceDatabase/mysql/connection/openPool';
import { VALENCE_SCHEMA } from '@ValenceServer/db/mysql/VALENCE_SCHEMA';

/**
 * Opens the connection pool and binds the schema to it, which is the one place the server learns
 * where its database is.
 *
 * @param databaseUrl - Where MySQL or MariaDB is, as `mysql://` or `mariadb://`.
 * @param connection - How many connections the pool may hold, and whether they use TLS.
 * @returns The database, ready to query.
 */
const createDatabase = (
  databaseUrl: string,
  connection: DatabaseConnection = DEFAULT_CONNECTION,
) => {
  const pool = openPool(databaseUrl, connection);
  const db = drizzle({ client: pool, schema: VALENCE_SCHEMA, mode: 'default' });

  return { db, pool, schema: VALENCE_SCHEMA };
};

export { createDatabase };
