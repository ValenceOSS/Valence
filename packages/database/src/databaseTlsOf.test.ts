import { describe, expect, it } from 'vitest';
import { databaseTlsOf } from './databaseTlsOf';

describe('databaseTlsOf', () => {
  it('reads the mode and the certificate file it was given', () => {
    expect(
      databaseTlsOf({ DATABASE_SSL: 'verify-full', DATABASE_SSL_CA: '/certs/ca.pem' }),
    ).toEqual({ mode: 'verify-full', ca: '/certs/ca.pem' });
  });

  it('has no certificate file where none was named', () => {
    expect(databaseTlsOf({ DATABASE_SSL: 'require' })).toEqual({ mode: 'require', ca: null });
  });
});
