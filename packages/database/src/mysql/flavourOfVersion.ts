type MysqlFlavour = 'mysql' | 'mariadb';

/**
 * Tells MySQL from MariaDB by the version a server gives, which is the one place MariaDB says so.
 *
 * @param version - What `select version()` answered.
 * @returns Which of the two it is.
 */
const flavourOfVersion = (version: string): MysqlFlavour =>
  version.toLowerCase().includes('mariadb') ? 'mariadb' : 'mysql';

export type { MysqlFlavour };

export { flavourOfVersion };
