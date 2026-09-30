import { createPool } from 'mysql2/promise';
import { readConnectionOptions } from '@ValenceRequests/db/mysql/connection/readConnectionOptions';
import { SESSION_SETUP } from '@ValenceRequests/db/mysql/connection/SESSION_SETUP';

/**
 * Opens a MySQL or MariaDB pool whose every connection keeps time in UTC, refuses what strict mode
 * refuses, counts the rows an update matched as Postgres does, and hands JSON back as text so both
 * engines read it alike.
 *
 * @param databaseUrl - Where the database is.
 * @returns The pool, which dials nothing until something is asked.
 */
const openPool = (databaseUrl: string) => {
  const pool = createPool({
    ...readConnectionOptions(databaseUrl),
    timezone: 'Z',
    charset: 'utf8mb4',
    flags: ['FOUND_ROWS'],
    supportBigNumbers: true,
    bigNumberStrings: false,
    jsonStrings: true,
    multipleStatements: false,
  });

  pool.pool.on('connection', (connection) => {
    connection.query(SESSION_SETUP, (error) => {
      if (error !== null) {
        connection.destroy();
      }
    });
  });

  return pool;
};

export { openPool };
