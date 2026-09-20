import { createHash } from 'node:crypto';
import { z } from 'zod';

const JournalSchema = z.object({
  entries: z.array(z.object({ tag: z.string().min(1), when: z.number().int() })),
});

type MissedMigration = { tag: string; when: number; hash: string; statements: string[] };

type ApplyMissedMigrationsOptions = {
  readJournal: () => Promise<string>;
  readAppliedAt: () => Promise<readonly number[]>;
  readSql: (tag: string) => Promise<string>;
  applyOne: (migration: MissedMigration) => Promise<void>;
};

const BREAKPOINT = '--> statement-breakpoint';

/**
 * Applies the migrations drizzle left behind, in the order the journal lists them.
 *
 * Drizzle decides what to run by comparing each migration's timestamp with the newest one the
 * database has already applied, so a migration stamped earlier than that is skipped for good — no
 * error, and the server goes on to say the database is up to date. That is what happens to anyone
 * whose database ran a later migration before an earlier-stamped one arrived, which is any two
 * branches adding migrations at once. It shows up as a column that does not exist.
 *
 * What is missing is decided the way `findPendingMigrations` decides it, by stamp, and each is run
 * in the journal's order rather than by stamp because a migration is written against the ones listed
 * before it. Each runs with its own ledger entry inside one transaction, so a migration that fails
 * leaves neither half of itself behind.
 *
 * @param readJournal - How to read the migration journal.
 * @param readAppliedAt - How to read the stamps this database has run.
 * @param readSql - How to read one migration's SQL, by its tag.
 * @param applyOne - How to run one migration and record it, atomically.
 * @returns The tags applied, in the order they were.
 */
const applyMissedMigrations = async ({
  readJournal,
  readAppliedAt,
  readSql,
  applyOne,
}: ApplyMissedMigrationsOptions): Promise<readonly string[]> => {
  const journal = JournalSchema.parse(JSON.parse(await readJournal()));
  const applied = new Set(await readAppliedAt());
  const applying: string[] = [];

  for (const entry of journal.entries) {
    if (applied.has(entry.when)) {
      continue;
    }

    const text = await readSql(entry.tag);

    await applyOne({
      tag: entry.tag,
      when: entry.when,
      hash: createHash('sha256').update(text).digest('hex'),
      statements: text
        .split(BREAKPOINT)
        .map((statement) => statement.trim())
        .filter((statement) => statement !== ''),
    });

    applying.push(entry.tag);
  }

  return applying;
};

export type { ApplyMissedMigrationsOptions, MissedMigration };

export { applyMissedMigrations };
