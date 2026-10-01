import { describe, expect, it } from 'vitest';
import { readMysqlAddress } from './readMysqlAddress';

describe('readMysqlAddress', () => {
  it('reads the parts of a mysql:// URL', () => {
    expect(readMysqlAddress('mysql://valence:secret@db:3307/valence')).toStrictEqual({
      host: 'db',
      port: 3307,
      user: 'valence',
      password: 'secret',
      database: 'valence',
    });
  });

  it('reads a mariadb:// URL the same way, which mysql2 would not', () => {
    expect(readMysqlAddress('mariadb://valence:secret@db/valence')).toStrictEqual({
      host: 'db',
      port: 3306,
      user: 'valence',
      password: 'secret',
      database: 'valence',
    });
  });

  it('decodes a password with characters a URL has to escape', () => {
    expect(readMysqlAddress('mysql://valence:p%40ss%2Fword@db/val%20ence')).toMatchObject({
      password: 'p@ss/word',
      database: 'val ence',
    });
  });

  it('refuses a URL for some other database', () => {
    expect(() => readMysqlAddress('postgres://valence@db/valence')).toThrow('mysql://');
  });
});
