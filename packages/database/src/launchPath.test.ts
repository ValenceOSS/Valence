import { describe, expect, it } from 'vitest';
import { launchPath } from './launchPath';

describe('launchPath', () => {
  it('starts the build of the entry it was built as, for the database it is given', () => {
    expect(launchPath('file:///app/apps/server/dist/Main.js', 'mariadb://db/valence')).toBe(
      './Main.mysql.js',
    );
    expect(launchPath('file:///app/apps/server/dist/Rollback.js', 'postgres://db/valence')).toBe(
      './Rollback.postgres.js',
    );
  });
});
