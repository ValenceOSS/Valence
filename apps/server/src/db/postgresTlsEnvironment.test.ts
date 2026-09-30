import { describe, expect, it } from 'vitest';
import { postgresTlsEnvironment } from './postgresTlsEnvironment';

describe('postgresTlsEnvironment', () => {
  it('leaves the tools to the address where TLS is off', () => {
    expect(postgresTlsEnvironment({ mode: 'off', ca: null })).toEqual({});
  });

  it('asks for the same mode, and the certificate, the server connects with', () => {
    expect(postgresTlsEnvironment({ mode: 'verify-full', ca: '/certs/ca.pem' })).toEqual({
      PGSSLMODE: 'verify-full',
      PGSSLROOTCERT: '/certs/ca.pem',
    });
    expect(postgresTlsEnvironment({ mode: 'require', ca: null })).toEqual({ PGSSLMODE: 'require' });
  });
});
