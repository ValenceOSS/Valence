import { NO_TLS } from '@ValenceDatabase/NO_TLS';
import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';
import { readMysqlFlavour } from '@ValenceServer/db/mysql/server/readMysqlFlavour';

/**
 * Says which database holds Valence's data, asking the server whether it is MySQL or MariaDB.
 *
 * @param databaseUrl - Where the database is.
 * @param tls - How a connection to it is encrypted, as the server's pool does.
 * @returns The database.
 */
const readDatabaseKind = (
  databaseUrl: string,
  tls: DatabaseTls = NO_TLS,
): Promise<'postgres' | 'mysql' | 'mariadb'> => readMysqlFlavour(databaseUrl, tls);

export { readDatabaseKind };
