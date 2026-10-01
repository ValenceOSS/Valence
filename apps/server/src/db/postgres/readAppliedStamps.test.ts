import { describe, expect, it } from 'vitest';
import { createDatabase } from './createDatabase';
import { readAppliedStamps } from './readAppliedStamps';

describe('readAppliedStamps', () => {
  it('reads none from a database it cannot reach, as from one never migrated', async () => {
    const { db, pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    await expect(readAppliedStamps(db)).resolves.toEqual([]);

    await pool.end();
  });
});
