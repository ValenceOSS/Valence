import { z } from 'zod';

const JournalSchema = z.object({
  entries: z.array(z.object({ when: z.number().int() })),
});

type FindNewerMigrationsOptions = {
  readJournal: () => Promise<string>;
  readAppliedAt: () => Promise<readonly number[]>;
};

/**
 * Counts the migrations this database has run that this release has never heard of.
 *
 * That only happens when a newer release migrated the database and an older one was started over
 * it afterwards. The older code then reads tables it does not understand, and nothing at the API
 * says why, so it is found here instead.
 *
 * @param readJournal - How to read the migration journal.
 * @param readAppliedAt - How to read the stamps this database has run.
 * @returns The stamps the database has run that the journal does not list.
 */
const findNewerMigrations = async ({
  readJournal,
  readAppliedAt,
}: FindNewerMigrationsOptions): Promise<readonly number[]> => {
  const known = new Set(
    JournalSchema.parse(JSON.parse(await readJournal())).entries.map((e) => e.when),
  );

  return (await readAppliedAt()).filter((stamp) => !known.has(stamp));
};

export type { FindNewerMigrationsOptions };

export { findNewerMigrations };
