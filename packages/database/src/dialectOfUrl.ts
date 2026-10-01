import { say } from '@ValenceI18n/say';
import type { Dialect } from './Dialect';

const DIALECTS: Readonly<Record<string, Dialect>> = {
  'postgres:': 'postgres',
  'postgresql:': 'postgres',
  'mysql:': 'mysql',
  'mariadb:': 'mysql',
};

/**
 * Reads which kind of database an address is for, from how it starts, so the server can run the
 * build that speaks to it.
 *
 * @param databaseUrl - The address, as `DATABASE_URL` gives it.
 * @returns The dialect: Postgres, or the MySQL family, which MariaDB is part of.
 * @throws If the address is for a database Valence cannot use, MongoDB among them.
 */
const dialectOfUrl = (databaseUrl: string): Dialect => {
  const { protocol } = new URL(databaseUrl);
  const dialect = DIALECTS[protocol];

  if (dialect === undefined) {
    throw new Error(say('database.urlIsForAnotherDatabase', { protocol }));
  }

  return dialect;
};

export { dialectOfUrl };
