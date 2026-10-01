import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { ValenceDatabase } from '@ValenceServer/db/postgres/ValenceDatabase';

const AppliedMigrationSchema = z.object({ created_at: z.union([z.string(), z.number()]) });

/**
 * Reads the stamps of the migrations this database has run, or none where it has never run any.
 *
 * A database nobody has migrated has no ledger table to read, which is not a fault — it is what
 * every first start looks like. Drizzle creates it as part of applying the first migration.
 *
 * @param db - The database to read.
 * @returns The stamps.
 */
const readAppliedStamps = async (db: ValenceDatabase): Promise<number[]> => {
  try {
    const applied = await db.execute(sql`select created_at from drizzle.__drizzle_migrations`);

    return applied.rows.map((row) => Number(AppliedMigrationSchema.parse(row).created_at));
  } catch {
    return [];
  }
};

export { readAppliedStamps };
