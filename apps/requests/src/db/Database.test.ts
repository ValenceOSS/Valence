import { describe, expect, it } from 'vitest';
import { createDatabase } from './Database';

describe('createDatabase', () => {
  it('opens a pool without dialling until something is asked', async () => {
    const { db, pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    expect(db).toBeDefined();

    await pool.end();
  });
});
