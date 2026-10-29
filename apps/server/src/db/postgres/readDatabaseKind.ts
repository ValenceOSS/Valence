import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';

/**
 * Says which database holds Valence's data, which on this dialect is always Postgres.
 *
 * @param _databaseUrl - Where the database is, which Postgres has no need to ask.
 * @param _tls - How a connection to it is encrypted, likewise.
 * @returns The database.
 */
const readDatabaseKind = (
  _databaseUrl: string,
  _tls?: DatabaseTls,
): Promise<'postgres' | 'mysql' | 'mariadb'> => Promise.resolve('postgres');

export { readDatabaseKind };
