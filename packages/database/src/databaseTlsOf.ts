import type { DatabaseTls } from './DatabaseTls';

/**
 * Reads how the connection to the database is to be encrypted from the settings it was started
 * with, so that the pool and every tool that opens a connection of its own agree.
 *
 * @param env - The settings.
 * @param env.DATABASE_SSL - Whether to use TLS, and whether to check who answers.
 * @param env.DATABASE_SSL_CA - A file holding the certificate the server's is signed by, if any.
 * @returns The setting.
 */
const databaseTlsOf = ({
  DATABASE_SSL,
  DATABASE_SSL_CA,
}: {
  DATABASE_SSL: DatabaseTls['mode'];
  DATABASE_SSL_CA?: string | undefined;
}): DatabaseTls => ({ mode: DATABASE_SSL, ca: DATABASE_SSL_CA ?? null });

export { databaseTlsOf };
