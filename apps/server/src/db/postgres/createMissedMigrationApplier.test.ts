import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { readRows } from '@ValenceDatabase/readRows';
import { authSchema, valenceSchema } from '@ValenceServer/db/postgres/Schema';
import { createMissedMigrationApplier } from './createMissedMigrationApplier';

const STARTING_POSTGRES_MS = 30_000;

const LEDGER_ROW = z.object({ hash: z.string(), created_at: z.union([z.string(), z.number()]) });

/**
 * A folder of two migrations, the second stamped earlier than the first as a branch would leave it.
 *
 * @returns Where the folder is.
 */
const aMigrationsFolder = async (): Promise<string> => {
  const folder = await mkdtemp(join(tmpdir(), 'valence-missed-'));

  await mkdir(join(folder, 'meta'));
  await writeFile(
    join(folder, 'meta', '_journal.json'),
    JSON.stringify({
      entries: [
        { tag: '0001_first', when: 200 },
        { tag: '0002_second', when: 100 },
      ],
    }),
  );
  await writeFile(join(folder, '0001_first.sql'), 'CREATE TABLE "first" ("id" text);');
  await writeFile(
    join(folder, '0002_second.sql'),
    'CREATE TABLE "second" ("id" text);\n--> statement-breakpoint\nINSERT INTO "second" VALUES (\'x\');',
  );

  return folder;
};

describe('createMissedMigrationApplier', () => {
  it(
    'applies only what the ledger has not seen, recording each as it goes',
    async () => {
      const db = drizzle(new PGlite(), { schema: { ...authSchema, ...valenceSchema } });

      await db.execute(sql.raw('CREATE SCHEMA drizzle'));
      await db.execute(
        sql.raw(
          'CREATE TABLE drizzle.__drizzle_migrations (id serial PRIMARY KEY, hash text NOT NULL, created_at bigint)',
        ),
      );
      await db.execute(
        sql.raw("INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('seen', 200)"),
      );

      const apply = createMissedMigrationApplier(db, await aMigrationsFolder());

      expect(await apply()).toStrictEqual(['0002_second']);
      expect(await apply()).toStrictEqual([]);
      expect(
        await readRows(db, sql.raw('SELECT id FROM second'), z.object({ id: z.string() })),
      ).toStrictEqual([{ id: 'x' }]);

      const ledger = await readRows(
        db,
        sql.raw('SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id'),
        LEDGER_ROW,
      );

      expect(ledger.map((row) => Number(row.created_at))).toStrictEqual([200, 100]);
    },
    STARTING_POSTGRES_MS,
  );
});
