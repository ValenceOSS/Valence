import { createConnection } from 'mysql2/promise';
import { describe, expect, it } from 'vitest';
import { readMysqlAddress } from '@ValenceDatabase/mysql/connection/readMysqlAddress';
import { readMysqlFlavour } from './readMysqlFlavour';

describe('readMysqlFlavour', () => {
  it('names the engine the tests run against as it names itself', async () => {
    const server = process.env.MYSQL_TEST_URL ?? '';
    const connection = await createConnection(readMysqlAddress(server));
    const [rows] = await connection.query('select version() like "%MariaDB%" as isMariaDb');

    await connection.end();

    await expect(readMysqlFlavour(server)).resolves.toBe(
      JSON.stringify(rows).includes('"isMariaDb":1') ? 'mariadb' : 'mysql',
    );
  });
});
