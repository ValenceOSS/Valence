import type { DatabaseTls } from '@ValenceDatabase/DatabaseTls';

/**
 * Says to Postgres's own tools how to encrypt their connection, which they read from the
 * environment rather than from any argument, so a snapshot connects the way the server does.
 *
 * @param tls - The server's TLS setting.
 * @returns The variables to run the tool with.
 */
const postgresTlsEnvironment = (tls: DatabaseTls): Record<string, string> =>
  tls.mode === 'off'
    ? {}
    : { PGSSLMODE: tls.mode, ...(tls.ca === null ? {} : { PGSSLROOTCERT: tls.ca }) };

export { postgresTlsEnvironment };
