import { getTableConfig } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { readRows } from './readRows';

describe('PLAYGROUND', () => {
  it('keeps one row to a name', () => {
    const config = getTableConfig(PLAYGROUND);

    expect(config.name).toBe('playground');
    expect(config.indexes.map((index) => index.config.name)).toEqual(['playground_name_idx']);
  });

  it('describes the table the playground makes', async () => {
    const db = await aPlayground();
    const made = await readRows(
      db,
      sql`select column_name as name from information_schema.columns where table_schema = database() and table_name = 'playground' order by ordinal_position`,
      z.object({ name: z.string() }),
    );

    expect(made.map((column) => column.name)).toEqual(
      getTableConfig(PLAYGROUND).columns.map((column) => column.name),
    );
  }, 30_000);
});
