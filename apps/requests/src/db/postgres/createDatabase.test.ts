import { describe, expect, it } from 'vitest';
import { createDatabase } from './createDatabase';

describe('createDatabase', () => {
  it('opens a pool without dialling until something is asked', async () => {
    const { db, pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    expect(db).toBeDefined();

    await pool.end();
  });

  it('works in UTC on every connection, whatever zone the database keeps', async () => {
    const { pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    expect(pool.options.options).toBe('-c timezone=UTC');

    await pool.end();
  });
});
