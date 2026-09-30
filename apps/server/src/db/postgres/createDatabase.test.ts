import { describe, expect, it } from 'vitest';
import { createDatabase } from './createDatabase';
import { VALENCE_SCHEMA } from './VALENCE_SCHEMA';

describe('createDatabase', () => {
  it('opens a pool without dialling until something is asked', async () => {
    const { db, pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    expect(db).toBeDefined();

    await pool.end();
  });

  it('hands back every table, the ones better-auth owns among them', async () => {
    const { pool, schema } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    expect(schema).toBe(VALENCE_SCHEMA);
    expect(Object.keys(schema)).toEqual(expect.arrayContaining(['user', 'session', 'mediaItem']));

    await pool.end();
  });
});
