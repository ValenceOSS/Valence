import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { applyMissedMigrations } from '@ValenceServer/db/applyMissedMigrations';
import type { ValenceDatabase } from '@ValenceServer/db/Database';

const AppliedMigrationSchema = z.object({ created_at: z.union([z.string(), z.number()]) });

/**
 * Builds the function that applies what drizzle skipped, against this database and the migrations
 * beside the server.
 *
 * Each migration and its ledger entry are written in one transaction, so a failure part way through
 * one leaves neither behind and the next start finds it still missing and tries it again.
 *
 * @param db - The database to bring up to date.
 * @param folder - The directory holding the migrations and their journal.
 * @returns What to call to apply them, which answers with the tags it applied.
 */
const createMissedMigrationApplier =
  (db: ValenceDatabase, folder: string) => (): Promise<readonly string[]> =>
    applyMissedMigrations({
      readJournal: () => readFile(join(folder, 'meta', '_journal.json'), 'utf8'),
      readAppliedAt: async () => {
        const applied = await db.execute(sql`select created_at from drizzle.__drizzle_migrations`);

        return applied.rows.map((row) => Number(AppliedMigrationSchema.parse(row).created_at));
      },
      readSql: (tag) => readFile(join(folder, `${tag}.sql`), 'utf8'),
      applyOne: (migration) =>
        db.transaction(async (transaction) => {
          for (const statement of migration.statements) {
            await transaction.execute(sql.raw(statement));
          }

          await transaction.execute(
            sql`insert into drizzle.__drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.when})`,
          );
        }),
    });

export { createMissedMigrationApplier };
