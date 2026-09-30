import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { REQUESTS_SCHEMA } from '@ValenceRequests/db/postgres/REQUESTS_SCHEMA';

/**
 * Opens the connection pool and binds the service's own schema to it.
 *
 * @param databaseUrl - Where Postgres is.
 * @returns The database, ready to query.
 */
const createDatabase = (databaseUrl: string) => {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema: REQUESTS_SCHEMA });

  return { db, pool };
};

export { createDatabase };
