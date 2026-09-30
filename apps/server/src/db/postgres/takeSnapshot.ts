import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runTool } from '@ValenceServer/db/runTool';

type TakeSnapshotOptions = {
  databaseUrl: string;
  folder: string;
  name: string;
  run?: typeof runTool;
  makeFolder?: (folder: string) => Promise<string | undefined>;
};

/**
 * Dumps the whole database into one file that `restoreSnapshot` can put back.
 *
 * Made with `--create` so that restoring drops the database and builds it again, which is the only
 * way a rollback also removes the tables a later migration added.
 *
 * @param databaseUrl - The database to dump.
 * @param folder - Where to put the file.
 * @param name - What to call it.
 * @param run - How to run a tool.
 * @param makeFolder - How to make the folder.
 * @returns Whether the snapshot was taken, or that `pg_dump` is not installed.
 * @throws If `pg_dump` ran and failed.
 */
const takeSnapshot = async ({
  databaseUrl,
  folder,
  name,
  run = runTool,
  makeFolder = (path) => mkdir(path, { recursive: true }),
}: TakeSnapshotOptions): Promise<'taken' | 'missing'> => {
  await makeFolder(folder);

  const outcome = await run('pg_dump', [
    '--format=custom',
    '--create',
    `--file=${join(folder, name)}`,
    `--dbname=${databaseUrl}`,
  ]);

  return outcome === 'ran' ? 'taken' : 'missing';
};

export type { TakeSnapshotOptions };

export { takeSnapshot };
