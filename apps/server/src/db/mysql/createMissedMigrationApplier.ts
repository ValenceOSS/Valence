import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { applyMissedMigrations } from '@ValenceServer/db/applyMissedMigrations';
import type { AnyValenceDatabase } from '@ValenceServer/db/mysql/AnyValenceDatabase';

const AppliedMigrationsSchema = z.tuple([
  z.array(z.object({ created_at: z.union([z.string(), z.number()]) })),
  z.array(z.object({})),
]);

/**
 * Builds the function that applies what drizzle skipped, against this database and the migrations
 * beside the server.
 *
 * MySQL commits every change to a table as it makes it, so a migration cannot be wrapped in a
 * transaction the way it is on Postgres. Its statements run one by one and its ledger entry is
 * written after the last of them; one that fails part way leaves what it had done behind, and the
 * snapshot taken before migrating is the way back.
 *
 * @param db - The database to bring up to date.
 * @param folder - The directory holding the migrations and their journal.
 * @returns What to call to apply them, which answers with the tags it applied.
 */
const createMissedMigrationApplier =
  (db: AnyValenceDatabase, folder: string) => (): Promise<readonly string[]> =>
    applyMissedMigrations({
      readJournal: () => readFile(join(folder, 'meta', '_journal.json'), 'utf8'),
      readAppliedAt: async () => {
        const [applied] = AppliedMigrationsSchema.parse(
          await db.execute(sql`select created_at from __drizzle_migrations`),
        );

        return applied.map((row) => Number(row.created_at));
      },
      readSql: (tag) => readFile(join(folder, `${tag}.sql`), 'utf8'),
      applyOne: async (migration) => {
        for (const statement of migration.statements) {
          await db.execute(sql.raw(statement));
        }

        await db.execute(
          sql`insert into __drizzle_migrations (hash, created_at) values (${migration.hash}, ${migration.when})`,
        );
      },
    });

export { createMissedMigrationApplier };
