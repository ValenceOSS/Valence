import { drizzle } from 'drizzle-orm/node-postgres';
import { DEFAULT_CONNECTION } from '@ValenceDatabase/DEFAULT_CONNECTION';
import type { DatabaseConnection } from '@ValenceDatabase/DatabaseConnection';
import { tlsOptions } from '@ValenceDatabase/tlsOptions';
import { IN_UTC } from '@ValenceDatabase/IN_UTC';
import { Pool } from 'pg';
import { VALENCE_SCHEMA } from '@ValenceServer/db/postgres/VALENCE_SCHEMA';

/**
 * Opens the connection pool and binds the schema to it, which is the one place the server learns
 * where its database is.
 *
 * Every connection works in UTC, as MySQL's already do. A timestamp the database fills in itself is
 * stored without a zone, so one taken in the database's own zone was an hour out on a British host
 * in summer.
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
    options: IN_UTC,
    ...(ssl === undefined ? {} : { ssl }),
  });
  const db = drizzle(pool, { schema: VALENCE_SCHEMA });

  return { db, pool, schema: VALENCE_SCHEMA };
};

export { createDatabase };
