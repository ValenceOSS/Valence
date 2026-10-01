import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';
import type { MysqlFlavour } from '@ValenceDatabase/mysql/flavourOfVersion';

const MODES = {
  mysql: { require: ['--ssl-mode=REQUIRED'], 'verify-full': ['--ssl-mode=VERIFY_IDENTITY'] },
  mariadb: { require: ['--ssl'], 'verify-full': ['--ssl', '--ssl-verify-server-cert'] },
} as const;

/**
 * Says to MySQL's or MariaDB's own tools how to encrypt their connection, in the words each asks
 * for, so a snapshot connects the way the server does.
 *
 * @param tls - The server's TLS setting.
 * @param flavour - Whose tools they are.
 * @returns The arguments to add.
 */
const mysqlTlsArguments = (tls: DatabaseTls, flavour: MysqlFlavour): string[] =>
  tls.mode === 'off'
    ? []
    : [...MODES[flavour][tls.mode], ...(tls.ca === null ? [] : [`--ssl-ca=${tls.ca}`])];

export { mysqlTlsArguments };
