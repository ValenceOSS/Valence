import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readMysqlFlavour } from '@ValenceServer/db/mysql/server/readMysqlFlavour';
import { readMysqlAddress } from '@ValenceDatabase/mysql/connection/readMysqlAddress';
import { NO_TLS } from '@ValenceDatabase/NO_TLS';
import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';
import { mysqlTlsArguments } from '@ValenceServer/db/mysql/server/mysqlTlsArguments';
import { runToolInto } from '@ValenceServer/db/runToolInto';
import type { MysqlFlavour } from '@ValenceDatabase/mysql/flavourOfVersion';

type TakeSnapshotOptions = {
  databaseUrl: string;
  tls?: DatabaseTls;
  folder: string;
  name: string;
  run?: typeof runToolInto;
  flavourOf?: (databaseUrl: string, tls: DatabaseTls) => Promise<MysqlFlavour>;
  makeFolder?: (folder: string) => Promise<string | undefined>;
};

const DUMP_TOOLS = {
  mysql: { command: 'mysqldump', own: ['--set-gtid-purged=OFF'] },
  mariadb: { command: 'mariadb-dump', own: [] },
} as const;

/**
 * Dumps the whole database into one gzipped file that `restoreSnapshot` can put back.
 *
 * Each server is dumped by its own tool: MySQL's `mysqldump` refuses a MariaDB server, and
 * `mariadb-dump` writes out MySQL's generated columns, which MySQL then refuses to read back. Made
 * with `--add-drop-database` so that restoring drops the database and builds it again, which is the
 * only way a rollback also removes the tables a later migration added, and with
 * `--single-transaction` so every table is read as it was at one moment without locking anybody
 * out. The password goes in the tool's environment rather than on a command line anybody on the
 * machine can read.
 *
 * @param databaseUrl - The database to dump.
 * @param tls - How the tool is to encrypt its connection, as the server's pool does.
 * @param folder - Where to put the file.
 * @param name - What to call it.
 * @param run - How to run a tool into a file.
 * @param flavourOf - How to tell whether the server is MySQL or MariaDB.
 * @param makeFolder - How to make the folder.
 * @returns Whether the snapshot was taken, or that the dump tool is not installed.
 * @throws If the dump tool ran and failed.
 */
const takeSnapshot = async ({
  databaseUrl,
  tls = NO_TLS,
  folder,
  name,
  run = runToolInto,
  flavourOf = readMysqlFlavour,
  makeFolder = (path) => mkdir(path, { recursive: true }),
}: TakeSnapshotOptions): Promise<'taken' | 'missing'> => {
  await makeFolder(folder);

  const { host, port, user, password, database } = readMysqlAddress(databaseUrl);
  const flavour = await flavourOf(databaseUrl, tls);
  const tool = DUMP_TOOLS[flavour];
  const outcome = await run({
    command: tool.command,
    args: [
      `--host=${host}`,
      `--port=${port.toString()}`,
      `--user=${user}`,
      ...mysqlTlsArguments(tls, flavour),
      '--single-transaction',
      '--routines',
      '--triggers',
      '--hex-blob',
      '--add-drop-database',
      ...tool.own,
      '--databases',
      database,
    ],
    env: { MYSQL_PWD: password },
    file: join(folder, name),
  });

  return outcome === 'ran' ? 'taken' : 'missing';
};

export type { TakeSnapshotOptions };

export { takeSnapshot };
