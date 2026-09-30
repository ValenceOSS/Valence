import { createConnection } from 'mysql2/promise';
import { z } from 'zod';
import { flavourOfVersion } from '@ValenceDatabase/mysql/flavourOfVersion';
import { readMysqlAddress } from '@ValenceDatabase/mysql/connection/readMysqlAddress';
import type { MysqlFlavour } from '@ValenceDatabase/mysql/flavourOfVersion';

const VERSION = z.tuple([z.tuple([z.object({ version: z.string() })]), z.array(z.object({}))]);

/**
 * Asks a server whether it is MySQL or MariaDB, since each is copied by its own dump tool and
 * neither tool copies the other's generated columns correctly.
 *
 * @param databaseUrl - The database to ask about.
 * @returns Which of the two it is.
 */
const readMysqlFlavour = async (databaseUrl: string): Promise<MysqlFlavour> => {
  const connection = await createConnection(readMysqlAddress(databaseUrl));

  try {
    return flavourOfVersion(
      VERSION.parse(await connection.query('select version() as version'))[0][0].version,
    );
  } finally {
    await connection.end();
  }
};

export { readMysqlFlavour };
