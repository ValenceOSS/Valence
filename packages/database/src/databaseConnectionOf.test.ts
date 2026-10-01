import { describe, expect, it } from 'vitest';
import { databaseConnectionOf } from './databaseConnectionOf';

describe('databaseConnectionOf', () => {
  it('reads the size of the pool and how its connections are encrypted', () => {
    expect(
      databaseConnectionOf({
        DATABASE_POOL_MAX: 25,
        DATABASE_SSL: 'verify-full',
        DATABASE_SSL_CA: '/certs/ca.pem',
      }),
    ).toEqual({ poolMax: 25, tls: { mode: 'verify-full', ca: '/certs/ca.pem' } });
  });
});
