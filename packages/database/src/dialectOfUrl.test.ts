import { describe, expect, it } from 'vitest';
import { dialectOfUrl } from './dialectOfUrl';

describe('dialectOfUrl', () => {
  it('reads a Postgres address, under either of its names', () => {
    expect(dialectOfUrl('postgres://valence@db:5432/valence')).toBe('postgres');
    expect(dialectOfUrl('postgresql://valence@db/valence')).toBe('postgres');
  });

  it('reads a MySQL or a MariaDB address as the MySQL family', () => {
    expect(dialectOfUrl('mysql://valence@db:3306/valence')).toBe('mysql');
    expect(dialectOfUrl('mariadb://valence@db/valence')).toBe('mysql');
  });

  it('refuses MongoDB, and says which databases it can use', () => {
    expect(() => dialectOfUrl('mongodb://db/valence')).toThrow(
      /postgres:\/\/, mysql:\/\/ or mariadb:\/\/, not mongodb:\/\/.*not MongoDB/,
    );
  });
});
