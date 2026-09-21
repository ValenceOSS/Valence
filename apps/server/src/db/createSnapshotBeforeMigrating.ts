import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { listSnapshots } from '@ValenceServer/db/listSnapshots';
import { nameSnapshot } from '@ValenceServer/db/nameSnapshot';
import { pruneSnapshots } from '@ValenceServer/db/pruneSnapshots';
import { takeSnapshot } from '@ValenceServer/db/takeSnapshot';

type CreateSnapshotBeforeMigratingOptions = {
  databaseUrl: string;
  folder: string;
  keep: number;
  isEnabled: boolean;
  readAppliedAt: () => Promise<readonly number[]>;
  say: (level: 'info' | 'error', line: string) => void;
  now?: () => Date;
};

/**
 * Builds the step that keeps a way back before a migration changes the database.
 *
 * Migrations only go forward, so the way back is a copy taken while the database is still as the
 * older release left it. A database that has never run a migration is left alone, since there is
 * nothing in it to lose.
 *
 * Where the postgres client is not installed, as on a development machine, it says so and the
 * migration goes ahead. Where it is installed and fails, the migration does not: a database
 * changed with no way back is the thing this exists to prevent.
 *
 * @param databaseUrl - The database to copy.
 * @param folder - Where the copies are kept.
 * @param keep - How many copies to leave, newest first.
 * @param isEnabled - Whether to take one at all.
 * @param readAppliedAt - How to read the stamps this database has run.
 * @param say - Where to report it.
 * @param now - The clock.
 * @returns What to call with the migrations about to run.
 * @throws From the returned function, if the copy could not be made.
 */
const createSnapshotBeforeMigrating =
  ({
    databaseUrl,
    folder,
    keep,
    isEnabled,
    readAppliedAt,
    say,
    now = () => new Date(),
  }: CreateSnapshotBeforeMigratingOptions) =>
  async (pending: readonly string[]): Promise<void> => {
    const last = pending.at(-1);

    if (!isEnabled || last === undefined || (await readAppliedAt()).length === 0) {
      return;
    }

    const name = nameSnapshot(now(), last);
    const outcome = await takeSnapshot({ databaseUrl, folder, name });

    if (outcome === 'missing') {
      say(
        'error',
        'pg_dump is not installed here, so no snapshot was taken before migrating. Rolling back to this point will not be possible.',
      );

      return;
    }

    say('info', `Took a snapshot before migrating: ${join(folder, name)}.`);

    await pruneSnapshots({
      names: await listSnapshots({ folder }),
      keep,
      remove: (old) => rm(join(folder, old)),
    });
  };

export type { CreateSnapshotBeforeMigratingOptions };

export { createSnapshotBeforeMigrating };
