import { describe, expect, it, vi } from 'vitest';
import { aPreparedPGlite } from './aPreparedPGlite';
import type { PGlite } from '@electric-sql/pglite';

describe('aPreparedPGlite', () => {
  it('prepares a database once, and starts every one after it from a copy', async () => {
    const recipe = `CREATE TABLE "kept" ("id" text PRIMARY KEY); -- ${String(Date.now())}`;
    const prepare = vi.fn(async (empty: PGlite) => {
      await empty.exec(recipe);
    });

    const one = await aPreparedPGlite('test', recipe, prepare);
    const two = await aPreparedPGlite('test', recipe, prepare);

    await one.exec(`INSERT INTO "kept" VALUES ('only in one')`);

    expect(prepare).toHaveBeenCalledOnce();
    expect((await two.query('SELECT * FROM "kept"')).rows).toEqual([]);
    expect((await one.query('SELECT * FROM "kept"')).rows).toHaveLength(1);
  }, 30_000);
});
