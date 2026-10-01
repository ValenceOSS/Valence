import { describe, expect, it } from 'vitest';
import { mysqlTlsArguments } from './mysqlTlsArguments';

describe('mysqlTlsArguments', () => {
  it('adds nothing where TLS is off', () => {
    expect(mysqlTlsArguments({ mode: 'off', ca: null }, 'mysql')).toEqual([]);
  });

  it("speaks MySQL's words to MySQL's tools", () => {
    expect(mysqlTlsArguments({ mode: 'verify-full', ca: '/certs/ca.pem' }, 'mysql')).toEqual([
      '--ssl-mode=VERIFY_IDENTITY',
      '--ssl-ca=/certs/ca.pem',
    ]);
  });

  it("speaks MariaDB's words to MariaDB's tools", () => {
    expect(mysqlTlsArguments({ mode: 'require', ca: null }, 'mariadb')).toEqual(['--ssl']);
    expect(mysqlTlsArguments({ mode: 'verify-full', ca: null }, 'mariadb')).toEqual([
      '--ssl',
      '--ssl-verify-server-cert',
    ]);
  });
});
