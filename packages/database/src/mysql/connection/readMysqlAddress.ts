type MysqlAddress = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

const MYSQL_PORT = 3306;

const PROTOCOLS = new Set(['mysql:', 'mariadb:']);

/**
 * Reads where a MySQL or MariaDB database is from its URL. mysql2 reads only `mysql://`, and the
 * dump tools read no URL at all, so both are handed the parts instead.
 *
 * @param url - The database's URL, `mysql://` or `mariadb://`.
 * @returns Its host, port, user, password and database.
 * @throws If the URL is for some other kind of database.
 */
const readMysqlAddress = (url: string): MysqlAddress => {
  const parsed = new URL(url);

  if (!PROTOCOLS.has(parsed.protocol)) {
    throw new Error(
      `A MySQL or MariaDB URL starts mysql:// or mariadb://, not ${parsed.protocol}//.`,
    );
  }

  return {
    host: parsed.hostname,
    port: parsed.port === '' ? MYSQL_PORT : Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\//, '')),
  };
};

export type { MysqlAddress };

export { readMysqlAddress };
