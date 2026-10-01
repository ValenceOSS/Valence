import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { AnyDatabase } from '#dialect/AnyDatabase';

/**
 * A database of its own, in memory, holding one small table to try the dialect helpers against.
 *
 * @returns The database.
 */
const aPlayground = async (): Promise<AnyDatabase> => {
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

  return drizzle(client);
};

export { aPlayground };
