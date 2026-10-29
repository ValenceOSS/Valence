import { describe, expect, it } from 'vitest';
import { readDatabaseKind } from './readDatabaseKind';

describe('readDatabaseKind', () => {
  it('says Postgres without asking', async () => {
    await expect(readDatabaseKind('postgres://valence@localhost/valence')).resolves.toBe(
      'postgres',
    );
  });
});
