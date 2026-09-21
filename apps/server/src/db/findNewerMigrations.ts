import { z } from 'zod';

const JournalSchema = z.object({
  entries: z.array(z.object({ when: z.number().int() })),
});

type FindNewerMigrationsOptions = {
  readJournal: () => Promise<string>;
  readAppliedAt: () => Promise<readonly number[]>;
};

/**
 * Finds the migrations this database has run that are newer than any this release carries.
 *
 * That only happens when a newer release migrated the database and an older one was started over
 * it afterwards. A stamp the journal does not list but that is older than its newest is not that:
 * it is left by a branch whose migration was since renumbered, the older code never reads it, and
 * refusing to start over it would stop a development database that is perfectly usable.
 *
 * @param readJournal - How to read the migration journal.
 * @param readAppliedAt - How to read the stamps this database has run.
 * @returns The stamps the database has run that are newer than the journal's newest.
 */
const findNewerMigrations = async ({
  readJournal,
  readAppliedAt,
}: FindNewerMigrationsOptions): Promise<readonly number[]> => {
  const newest = Math.max(
    ...JournalSchema.parse(JSON.parse(await readJournal())).entries.map((entry) => entry.when),
  );

  return (await readAppliedAt()).filter((stamp) => stamp > newest);
};

export type { FindNewerMigrationsOptions };

export { findNewerMigrations };
