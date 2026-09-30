import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { applyMigrations } from '#dialect/applyMigrations';
import { readAppliedStamps } from '#dialect/readAppliedStamps';
import type { ValenceDatabase } from '#dialect/ValenceDatabase';
import { createMissedMigrationApplier } from '@ValenceServer/db/createMissedMigrationApplier';
import { createSnapshotBeforeMigrating } from '@ValenceServer/db/createSnapshotBeforeMigrating';
import { findNewerMigrations } from '@ValenceServer/db/findNewerMigrations';
import { findPendingMigrations } from '@ValenceServer/db/findPendingMigrations';
import { migrateToLatest } from '@ValenceServer/db/migrateToLatest';
import type { MigrationPlan } from '@ValenceServer/db/planMigration';

type MigrateDatabaseOptions = {
  db: ValenceDatabase;
  databaseUrl: string;
  migrations: string;
  backups: { folder: string; keep: number; isEnabled: boolean };
  isAllowed: boolean;
  say: (level: 'info' | 'error', line: string) => void;
};

/**
 * Brings the database up to the migrations this release carries, keeping a way back first, which is
 * what both starting the server and running the migrations by hand do.
 *
 * @param db - The database to bring up to date.
 * @param databaseUrl - Where it is, for the copy taken beforehand.
 * @param migrations - The directory holding this dialect's migrations and their journal.
 * @param backups - Where copies are kept, how many, and whether to take one at all.
 * @param isAllowed - Whether the migrations may be applied.
 * @param say - Where to report what happened.
 * @returns What it decided to do.
 */
const migrateDatabase = ({
  db,
  databaseUrl,
  migrations,
  backups,
  isAllowed,
  say,
}: MigrateDatabaseOptions): Promise<MigrationPlan> => {
  const readJournal = () => readFile(join(migrations, 'meta', '_journal.json'), 'utf8');
  const readAppliedAt = () => readAppliedStamps(db);

  return migrateToLatest({
    pending: () => findPendingMigrations({ readJournal, readAppliedAt }),
    apply: () => applyMigrations(db, migrations),
    applyMissed: createMissedMigrationApplier(db, migrations),
    newer: () => findNewerMigrations({ readJournal, readAppliedAt }),
    beforeApply: createSnapshotBeforeMigrating({
      databaseUrl,
      folder: backups.folder,
      keep: backups.keep,
      isEnabled: backups.isEnabled,
      readAppliedAt,
      say,
    }),
    isAllowed,
    say,
  });
};

export type { MigrateDatabaseOptions };

export { migrateDatabase };
