import { drizzle } from 'drizzle-orm/node-postgres';
import { DEFAULT_CONNECTION } from '@ValenceDatabase/DEFAULT_CONNECTION';
import type { DatabaseConnection } from '@ValenceDatabase/DatabaseConnection';
import { tlsOptions } from '@ValenceDatabase/tlsOptions';
import { Pool } from 'pg';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';

/**
 * Opens the connection pool and binds the service's own schema to it.
 *
 * @param databaseUrl - Where Postgres is.
 * @param connection - How many connections the pool may hold, and whether they use TLS.
 * @returns The database, ready to query.
 */
const createDatabase = (
  databaseUrl: string,
  connection: DatabaseConnection = DEFAULT_CONNECTION,
) => {
  const ssl = tlsOptions(connection.tls);
  const pool = new Pool({
    connectionString: databaseUrl,
    max: connection.poolMax,
    ...(ssl === undefined ? {} : { ssl }),
  });
  const db = drizzle(pool, { schema: REQUESTS_SCHEMA });

  return { db, pool };
};

export { createDatabase };
