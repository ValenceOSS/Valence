import { describeNewerSchema } from '@ValenceServer/db/describeNewerSchema';
import { planMigration } from '@ValenceServer/db/planMigration';
import type { MigrationPlan } from '@ValenceServer/db/planMigration';

type MigrateToLatestOptions = {
  pending: () => Promise<readonly string[]>;
  apply: () => Promise<void>;
  applyMissed?: () => Promise<readonly string[]>;
  beforeApply?: (pending: readonly string[]) => Promise<void>;
  newer?: () => Promise<readonly number[]>;
  isAllowed: boolean;
  say: (level: 'info' | 'error', line: string) => void;
};

/**
 * Brings a database up to the migrations this release carries, before anything reads it.
 *
 * The order is the point. A scan is enqueued as soon as the job queue starts, and a scan against a
 * half-migrated schema is the failure this exists to prevent — `column "probeVersion" does not
 * exist` and `relation "book" does not exist` are both on record. So this runs ahead of the queue
 * rather than beside it, and a failure to migrate stops the server rather than letting it come up
 * to serve errors from the tables that moved.
 *
 * Safe to run unattended: one box, one container, one server, so there is no
 * second instance to race. Drizzle takes a lock regardless.
 *
 * @param pending - Reads which migrations this database has not run.
 * @param apply - Runs them.
 * @param applyMissed - Runs whatever `apply` left behind. Drizzle skips a migration stamped earlier
 *   than one the database has already run and says nothing, so what it did is checked rather than
 *   trusted, and what it skipped is run here.
 * @param beforeApply - Runs once the migrations are known and before the first is applied, which is
 *   where a way back is kept.
 * @param newer - Reads the migrations the database has run that this release does not carry.
 * @param isAllowed - Whether this server may apply them itself.
 * @param say - Where to report what happened.
 * @returns What it decided to do.
 * @throws If a newer release has already migrated the database, or the migrations could not be applied, or some are still missing once everything has been
 * tried, since coming up on a schema that half moved is worse than not coming up.
 */
const migrateToLatest = async ({
  pending,
  apply,
  applyMissed,
  beforeApply,
  newer,
  isAllowed,
  say,
}: MigrateToLatestOptions): Promise<MigrationPlan> => {
  const ahead = newer === undefined ? [] : await newer();

  if (ahead.length > 0) {
    throw new Error(describeNewerSchema(ahead.length));
  }

  const plan = planMigration({ pending: await pending(), isAllowed });

  if (plan.kind === 'inStep') {
    return plan;
  }

  if (plan.kind === 'refuse') {
    say('error', plan.saying);

    return plan;
  }

  say('info', plan.saying);

  await beforeApply?.(plan.pending);
  await apply();

  if (applyMissed !== undefined) {
    const missed = await pending();

    if (missed.length > 0) {
      say(
        'info',
        `Drizzle skipped ${missed.length.toString()} of them, which it does for any migration stamped earlier than one already run: ${missed.join(', ')}. Applying them now, in the order they were written.`,
      );

      await applyMissed();

      const stillMissing = await pending();

      if (stillMissing.length > 0) {
        throw new Error(`These migrations could not be applied: ${stillMissing.join(', ')}.`);
      }
    }
  }

  say('info', `The database is up to date with this release.`);

  return plan;
};

export type { MigrateToLatestOptions };

export { migrateToLatest };
