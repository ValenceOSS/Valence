import { randomBytes } from 'node:crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import { createConnection, createPool } from 'mysql2/promise';
import type { AnyDatabase } from './AnyDatabase';

/**
 * A database of its own, on the MySQL or MariaDB that `MYSQL_TEST_URL` names, holding one small
 * table to try the dialect helpers against.
 *
 * @returns The database.
 */
const aPlayground = async (): Promise<AnyDatabase> => {
  const url = process.env.MYSQL_TEST_URL;

  if (url === undefined || url === '') {
    throw new Error(
      'MYSQL_TEST_URL is not set. Bring up compose.test.yaml and point it at mysql://root:valence@127.0.0.1:3307 (MySQL) or :3308 (MariaDB).',
    );
  }

  const database = `valence_test_${randomBytes(8).toString('hex')}`;
  const setup = await createConnection({ uri: url });

  await setup.query(`CREATE DATABASE \`${database}\``);
  await setup.end();

  const pool = createPool({
    uri: url,
    database,
    timezone: 'Z',
    flags: ['FOUND_ROWS'],
    maxIdle: 0,
  });

  pool.on('connection', (connection) => {
    void connection.query("SET time_zone = '+00:00'");
  });

  await pool.query(`
    CREATE TABLE \`playground\` (
      \`id\` varchar(64) PRIMARY KEY,
      \`name\` varchar(255) NOT NULL,
      \`note\` text,
      \`count\` int NOT NULL DEFAULT 0,
      \`tags\` json,
      \`people\` json,
      \`startedAt\` datetime(3),
      \`endedAt\` datetime(3),
      UNIQUE INDEX \`playground_name_idx\` (\`name\`)
    )
  `);

  return drizzle(pool);
};

export { aPlayground };
