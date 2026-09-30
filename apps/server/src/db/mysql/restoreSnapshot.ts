import { join } from 'node:path';
import { readMysqlFlavour } from '@ValenceServer/db/mysql/server/readMysqlFlavour';
import { readMysqlAddress } from '@ValenceDatabase/mysql/connection/readMysqlAddress';
import { runToolFrom } from '@ValenceServer/db/runToolFrom';
import type { MysqlFlavour } from '@ValenceDatabase/mysql/flavourOfVersion';

type RestoreSnapshotOptions = {
  databaseUrl: string;
  folder: string;
  name: string;
  run?: typeof runToolFrom;
  flavourOf?: (databaseUrl: string) => Promise<MysqlFlavour>;
};

const CLIENTS = { mysql: 'mysql', mariadb: 'mariadb' } as const;

/**
 * Puts a snapshot back, replacing the database as it is now.
 *
 * The snapshot drops the database and creates it again itself, so the server's own client connects
 * to the server rather than to the database being replaced. Nothing else may be using it, so
 * Valence has to be stopped first.
 *
 * @param databaseUrl - The database to replace.
 * @param folder - Where the snapshots are kept.
 * @param name - Which snapshot.
 * @param run - How to run a tool fed from a file.
 * @param flavourOf - How to tell whether the server is MySQL or MariaDB.
 * @returns Nothing; it resolves once the database is back.
 * @throws If the client is not installed, or ran and failed.
 */
const restoreSnapshot = async ({
  databaseUrl,
  folder,
  name,
  run = runToolFrom,
  flavourOf = readMysqlFlavour,
}: RestoreSnapshotOptions): Promise<void> => {
  const { host, port, user, password } = readMysqlAddress(databaseUrl);
  const command = CLIENTS[await flavourOf(databaseUrl)];
  const outcome = await run({
    command,
    args: [`--host=${host}`, `--port=${port.toString()}`, `--user=${user}`],
    env: { MYSQL_PWD: password },
    file: join(folder, name),
  });

  if (outcome === 'missing') {
    throw new Error(`${command} is not installed here, so nothing could be restored.`);
  }
};

export type { RestoreSnapshotOptions };

export { restoreSnapshot };
