import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { applyMigrations } from './applyMigrations';
import { createDatabase } from './createDatabase';

describe('applyMigrations', () => {
  it('fails rather than pretending, where the database cannot be reached', async () => {
    const { db, pool } = createDatabase('postgres://nobody:nothing@127.0.0.1:1/nowhere');

    await expect(
      applyMigrations(db, join(import.meta.dirname, '..', '..', '..', 'drizzle', 'postgres')),
    ).rejects.toThrow();

    await pool.end();
  });
});
