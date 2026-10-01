import { databaseTlsOf } from './databaseTlsOf';
import type { DatabaseConnection } from './DatabaseConnection';
import type { DatabaseTls } from './DatabaseTls';

/**
 * Reads how to connect to the database from the settings it was started with: how many connections
 * the pool may hold, and how each is encrypted.
 *
 * @param env - The settings.
 * @param env.DATABASE_POOL_MAX - The most connections the pool may hold open.
 * @param env.DATABASE_SSL - Whether to use TLS, and whether to check who answers.
 * @param env.DATABASE_SSL_CA - A file holding the certificate the server's is signed by, if any.
 * @returns The connection setting.
 */
const databaseConnectionOf = (env: {
  DATABASE_POOL_MAX: number;
  DATABASE_SSL: DatabaseTls['mode'];
  DATABASE_SSL_CA?: string | undefined;
}): DatabaseConnection => ({ poolMax: env.DATABASE_POOL_MAX, tls: databaseTlsOf(env) });

export { databaseConnectionOf };
