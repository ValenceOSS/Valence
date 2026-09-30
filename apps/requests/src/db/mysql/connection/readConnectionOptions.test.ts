import { describe, expect, it } from 'vitest';
import { readConnectionOptions } from './readConnectionOptions';

describe('readConnectionOptions', () => {
  it('reads a mariadb address as mysql2 would connect to it', () => {
    expect(readConnectionOptions('mariadb://valence:p%40ss@db:3307/valence')).toEqual({
      host: 'db',
      port: 3307,
      user: 'valence',
      password: 'p@ss',
      database: 'valence',
    });
  });

  it('takes the usual port and leaves the database out where the address names none', () => {
    expect(readConnectionOptions('mysql://root:valence@127.0.0.1')).toEqual({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'valence',
    });
  });

  it('refuses an address for another database', () => {
    expect(() => readConnectionOptions('postgres://valence:valence@db:5432/valence')).toThrow(
      'mysql:// or mariadb://',
    );
  });
});
