import { createPool } from 'mysql2/promise';
import { DEFAULT_CONNECTION } from '@ValenceDatabase/DEFAULT_CONNECTION';
import { tlsOptions } from '@ValenceDatabase/tlsOptions';
import type { DatabaseConnection } from '@ValenceDatabase/DatabaseConnection';
import { readMysqlAddress } from './readMysqlAddress';

const SESSION =
  "SET time_zone = '+00:00', sql_mode = 'STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION,ONLY_FULL_GROUP_BY'";

/**
 * Opens a MySQL or MariaDB pool whose every connection keeps time in UTC and refuses what strict
 * mode refuses, so a moment reads back as it was written and a value too long for its column fails
 * rather than being cut. It counts the rows an update matched, as Postgres does, and hands JSON back
 * as text so both engines read it alike.
 *
 * @param databaseUrl - Where the database is, as `mysql://` or `mariadb://`.
 * @param connection - How many connections it may hold open at once, and whether they use TLS.
 * @returns The pool, which dials nothing until something is asked.
 */
const openPool = (databaseUrl: string, connection: DatabaseConnection = DEFAULT_CONNECTION) => {
  const ssl = tlsOptions(connection.tls);
  const pool = createPool({
    ...readMysqlAddress(databaseUrl),
    ...(ssl === undefined ? {} : { ssl }),
    connectionLimit: connection.poolMax,
    timezone: 'Z',
    supportBigNumbers: true,
    bigNumberStrings: false,
    jsonStrings: true,
    charset: 'utf8mb4',
    flags: ['FOUND_ROWS'],
    multipleStatements: false,
  });

  pool.pool.on('connection', (opened) => {
    opened.query(SESSION, (problem) => {
      if (problem !== null) {
        opened.destroy();
      }
    });
  });

  return pool;
};

export { openPool };
