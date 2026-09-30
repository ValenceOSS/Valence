import { drizzle } from 'drizzle-orm/mysql2';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/mysql/REQUESTS_SCHEMA';
import { openPool } from '@ValenceRequests/db/mysql/connection/openPool';

/**
 * Opens the connection pool and binds the service's own tables to it.
 *
 * @param databaseUrl - Where MySQL or MariaDB is.
 * @returns The database, ready to query.
 */
const createDatabase = (databaseUrl: string) => {
  const pool = openPool(databaseUrl);
  const db = drizzle(pool, { schema: REQUESTS_SCHEMA, mode: 'default' });

  return { db, pool };
};

export { createDatabase };
