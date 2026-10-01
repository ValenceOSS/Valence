import { readFileSync } from 'node:fs';
import type { DatabaseTls } from './DatabaseTls';

/**
 * Turns the TLS setting into what both drivers take as their `ssl` option: nothing where TLS is
 * off, encryption without checking who answers for `require`, and a check against the system's
 * certificates, or the one named, for `verify-full`.
 *
 * @param tls - The setting.
 * @param read - Reads the certificate file, which a test replaces.
 * @returns The driver option, or nothing for a plain connection.
 */
const tlsOptions = (
  tls: DatabaseTls,
  read: (path: string) => string = (path) => readFileSync(path, 'utf8'),
): { rejectUnauthorized: boolean; ca?: string } | undefined => {
  if (tls.mode === 'off') {
    return undefined;
  }

  return {
    rejectUnauthorized: tls.mode === 'verify-full',
    ...(tls.ca === null ? {} : { ca: read(tls.ca) }),
  };
};

export { tlsOptions };
