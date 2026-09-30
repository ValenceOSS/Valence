import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { VALENCE_SCHEMA } from '@ValenceServer/db/postgres/VALENCE_SCHEMA';

/**
 * Opens the connection pool and binds the schema to it, which is the one place the server learns
 * where its database is.
 *
 * @param databaseUrl - Where Postgres is.
 * @returns The database, ready to query.
 */
const createDatabase = (databaseUrl: string) => {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema: VALENCE_SCHEMA });

  return { db, pool, schema: VALENCE_SCHEMA };
};

export { createDatabase };
