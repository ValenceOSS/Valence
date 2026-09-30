import { createConnection } from 'mysql2/promise';
import { z } from 'zod';
import { readMysqlAddress } from './connection/readMysqlAddress';
import { flavourOfVersion } from './flavourOfVersion';
import { scratchDatabaseName } from './scratchDatabaseName';

const VersionSchema = z.tuple([z.object({ version: z.string() })]);

const COLLATIONS = { mysql: 'utf8mb4_0900_bin', mariadb: 'utf8mb4_nopad_bin' } as const;

/**
 * Opens a connection to the engine the tests run against, outside any database of its own.
 *
 * @returns The connection.
 * @throws If `MYSQL_TEST_URL` is not set, since a test that cannot reach its engine must fail
 *   rather than pass by never running.
 */
const toTheTestServer = async () => {
  const server = process.env.MYSQL_TEST_URL;

  if (server === undefined || server === '') {
    throw new Error(
      'MYSQL_TEST_URL is not set. Bring up compose.test.yaml and point it at mysql://root:valence@127.0.0.1:3307 (MySQL) or :3308 (MariaDB).',
    );
  }

  const { host, port, user, password } = readMysqlAddress(server);

  return { server, connection: await createConnection({ host, port, user, password }) };
};

/**
 * Makes an empty database for a test on the MySQL or MariaDB that `MYSQL_TEST_URL` names, in the
 * binary, no-pad collation Valence needs there, which each engine names differently.
 *
 * @returns Its name, the URL that reaches it, and what drops it again.
 * @throws If `MYSQL_TEST_URL` is not set.
 */
const createScratchDatabase = async () => {
  const name = scratchDatabaseName();
  const { server, connection } = await toTheTestServer();

  try {
    const [rows] = await connection.query('select version() as version');
    const [{ version }] = VersionSchema.parse(rows);
    const collation = COLLATIONS[flavourOfVersion(version)];

    await connection.query(
      `create database \`${name}\` character set utf8mb4 collate ${collation}`,
    );
  } finally {
    await connection.end();
  }

  const url = new URL(server);

  url.pathname = `/${name}`;

  return {
    name,
    url: url.toString(),
    drop: async (): Promise<void> => {
      const { connection: dropping } = await toTheTestServer();

      try {
        await dropping.query(`drop database if exists \`${name}\``);
      } finally {
        await dropping.end();
      }
    },
  };
};

export { createScratchDatabase };
