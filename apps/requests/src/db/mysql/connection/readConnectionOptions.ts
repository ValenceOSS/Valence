import { z } from 'zod';

const MYSQL_PORT = 3306;

const ConnectionUrlSchema = z
  .string()
  .transform((address) => new URL(address))
  .refine(
    (address) => address.protocol === 'mysql:' || address.protocol === 'mariadb:',
    'A MySQL or MariaDB address starts with mysql:// or mariadb://',
  );

/**
 * Reads a `mysql://` or `mariadb://` address as the options mysql2 connects with, since mysql2
 * does not understand the `mariadb://` scheme and a password in an address arrives percent-encoded.
 *
 * @param databaseUrl - Where the database is.
 * @returns The host, port, user, password and database to connect with.
 */
const readConnectionOptions = (databaseUrl: string) => {
  const address = ConnectionUrlSchema.parse(databaseUrl);
  const database = decodeURIComponent(address.pathname.replace(/^\//, ''));

  return {
    host: address.hostname,
    port: address.port === '' ? MYSQL_PORT : Number(address.port),
    user: decodeURIComponent(address.username),
    password: decodeURIComponent(address.password),
    ...(database === '' ? {} : { database }),
  };
};

export { readConnectionOptions };
