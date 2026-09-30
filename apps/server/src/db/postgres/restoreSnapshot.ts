import { join } from 'node:path';
import { runTool } from '@ValenceServer/db/runTool';

type RestoreSnapshotOptions = {
  databaseUrl: string;
  folder: string;
  name: string;
  run?: typeof runTool;
};

/**
 * Puts a snapshot back, replacing the database as it is now.
 *
 * Connects to the server's own `postgres` database rather than the one being replaced, since a
 * database cannot be dropped from inside itself. Nothing else may be connected, so Valence has to
 * be stopped first.
 *
 * @param databaseUrl - The database to replace.
 * @param folder - Where the snapshots are kept.
 * @param name - Which snapshot.
 * @returns Nothing; it resolves once the database is back.
 * @throws If `pg_restore` is not installed, or ran and failed.
 */
const restoreSnapshot = async ({
  databaseUrl,
  folder,
  name,
  run = runTool,
}: RestoreSnapshotOptions): Promise<void> => {
  const maintenance = new URL(databaseUrl);

  maintenance.pathname = '/postgres';

  const outcome = await run('pg_restore', [
    '--clean',
    '--create',
    '--if-exists',
    '--no-owner',
    `--dbname=${maintenance.toString()}`,
    join(folder, name),
  ]);

  if (outcome === 'missing') {
    throw new Error('pg_restore is not installed here, so nothing could be restored.');
  }
};

export type { RestoreSnapshotOptions };

export { restoreSnapshot };
