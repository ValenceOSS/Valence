import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { NO_TLS } from '@ValenceDatabase/NO_TLS';
import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';
import { postgresTlsEnvironment } from '@ValenceServer/db/postgresTlsEnvironment';
import { runTool } from '@ValenceServer/db/runTool';

type TakeSnapshotOptions = {
  databaseUrl: string;
  tls?: DatabaseTls;
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
 * @param tls - How the tool is to encrypt its connection, as the server's pool does.
 * @param folder - Where to put the file.
 * @param name - What to call it.
 * @param run - How to run a tool.
 * @param makeFolder - How to make the folder.
 * @returns Whether the snapshot was taken, or that `pg_dump` is not installed.
 * @throws If `pg_dump` ran and failed.
 */
const takeSnapshot = async ({
  databaseUrl,
  tls = NO_TLS,
  folder,
  name,
  run = runTool,
  makeFolder = (path) => mkdir(path, { recursive: true }),
}: TakeSnapshotOptions): Promise<'taken' | 'missing'> => {
  await makeFolder(folder);

  const outcome = await run(
    'pg_dump',
    ['--format=custom', '--create', `--file=${join(folder, name)}`, `--dbname=${databaseUrl}`],
    postgresTlsEnvironment(tls),
  );

  return outcome === 'ran' ? 'taken' : 'missing';
};

export type { TakeSnapshotOptions };

export { takeSnapshot };
