import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { VALENCE_SCHEMA } from '@ValenceServer/db/postgres/VALENCE_SCHEMA';
import type { AnyValenceDatabase } from '@ValenceServer/db/postgres/AnyValenceDatabase';

/**
 * A database of its own, in memory, holding one small table to try the dialect helpers against.
 *
 * @returns The database.
 */
const aPlayground = async (): Promise<AnyValenceDatabase> => {
  const client = new PGlite();

  await client.exec(`
    CREATE TABLE "playground" (
      "id" text PRIMARY KEY,
      "name" text NOT NULL,
      "note" text,
      "count" integer NOT NULL DEFAULT 0,
      "tags" jsonb,
      "people" jsonb,
      "startedAt" timestamp,
      "endedAt" timestamp
    );
    CREATE UNIQUE INDEX "playground_name_idx" ON "playground" ("name");
  `);

  return drizzle(client, { schema: VALENCE_SCHEMA });
};

export { aPlayground };
