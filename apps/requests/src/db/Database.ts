import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { setting } from '@ValenceRequests/db/Schema';

const schema = { setting };

type RequestsDatabase = ReturnType<typeof createDatabase>['db'];

/**
 * Opens the connection pool and binds the service's own schema to it.
 *
 * @param databaseUrl - Where Postgres is.
 * @returns The database, ready to query.
 */
const createDatabase = (databaseUrl: string) => {
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });

  return { db, pool };
};

export type { RequestsDatabase };

export { createDatabase };
