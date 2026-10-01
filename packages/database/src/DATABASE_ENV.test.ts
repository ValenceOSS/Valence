import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { DATABASE_ENV } from './DATABASE_ENV';

const Schema = z.object(DATABASE_ENV);

describe('DATABASE_ENV', () => {
  it('holds ten connections in plain text unless told otherwise', () => {
    expect(Schema.parse({})).toEqual({ DATABASE_POOL_MAX: 10, DATABASE_SSL: 'off' });
  });

  it('reads the settings as the environment gives them, as text', () => {
    expect(
      Schema.parse({ DATABASE_POOL_MAX: '4', DATABASE_SSL: 'require', DATABASE_SSL_CA: '/ca.pem' }),
    ).toEqual({ DATABASE_POOL_MAX: 4, DATABASE_SSL: 'require', DATABASE_SSL_CA: '/ca.pem' });
  });

  it('refuses a TLS mode it does not know, and a pool with no room', () => {
    expect(() => Schema.parse({ DATABASE_SSL: 'prefer' })).toThrow();
    expect(() => Schema.parse({ DATABASE_POOL_MAX: '0' })).toThrow();
  });
});
