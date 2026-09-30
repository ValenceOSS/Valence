import { describe, expect, it } from 'vitest';
import { checkDialect } from './checkDialect';

describe('checkDialect', () => {
  it('lets a build start against the kind of database it is for', () => {
    expect(() => checkDialect('mariadb://valence@db/valence', 'mysql')).not.toThrow();
    expect(() => checkDialect('postgres://valence@db/valence', 'postgres')).not.toThrow();
  });

  it('refuses a build started against the other kind, naming both', () => {
    expect(() => checkDialect('mysql://valence@db/valence', 'postgres')).toThrow(
      'This build of Valence is for postgres, but DATABASE_URL is a mysql address.',
    );
  });
});
