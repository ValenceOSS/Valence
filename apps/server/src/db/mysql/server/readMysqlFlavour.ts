import { createConnection } from 'mysql2/promise';
import { z } from 'zod';
import { flavourOfVersion } from '@ValenceDatabase/mysql/flavourOfVersion';
import { readMysqlAddress } from '@ValenceDatabase/mysql/connection/readMysqlAddress';
import { NO_TLS } from '@ValenceDatabase/NO_TLS';
import { tlsOptions } from '@ValenceDatabase/tlsOptions';
import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';
import type { MysqlFlavour } from '@ValenceDatabase/mysql/flavourOfVersion';

const VERSION = z.tuple([z.tuple([z.object({ version: z.string() })]), z.array(z.object({}))]);

/**
 * Asks a server whether it is MySQL or MariaDB, since each is copied by its own dump tool and
 * neither tool copies the other's generated columns correctly.
 *
 * @param databaseUrl - The database to ask about.
 * @param tls - How the tool is to encrypt its connection, as the server's pool does.
 * @returns Which of the two it is.
 */
const readMysqlFlavour = async (
  databaseUrl: string,
  tls: DatabaseTls = NO_TLS,
): Promise<MysqlFlavour> => {
  const ssl = tlsOptions(tls);
  const connection = await createConnection({
    ...readMysqlAddress(databaseUrl),
    ...(ssl === undefined ? {} : { ssl }),
  });

  try {
    return flavourOfVersion(
      VERSION.parse(await connection.query('select version() as version'))[0][0].version,
    );
  } finally {
    await connection.end();
  }
};

export { readMysqlFlavour };
