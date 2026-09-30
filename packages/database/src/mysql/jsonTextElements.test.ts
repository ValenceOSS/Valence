import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonTextElements } from './jsonTextElements';
import { readRows } from './readRows';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Many', tags: ['anime', 'comedy'] },
    { id: 'b', name: 'None' },
  ]);
}, 30_000);

describe('jsonTextElements', () => {
  it('spreads an array into a row for each string, and none for a missing array', async () => {
    const tag = jsonTextElements(PLAYGROUND.tags, 'tag');

    await expect(
      readRows(
        db,
        sql`select ${PLAYGROUND.name} as name, ${tag.value} as tag from ${PLAYGROUND} cross join ${tag.rows} order by tag`,
        z.object({ name: z.string(), tag: z.string() }),
      ),
    ).resolves.toEqual([
      { name: 'Many', tag: 'anime' },
      { name: 'Many', tag: 'comedy' },
    ]);
  });

  it('joins onto the table it is read from, as the facets do', async () => {
    const tag = jsonTextElements(PLAYGROUND.tags, 'tag');

    await expect(
      db
        .select({ value: tag.value })
        .from(sql`${PLAYGROUND}, ${tag.rows}`)
        .groupBy(tag.value)
        .orderBy(tag.value),
    ).resolves.toEqual([{ value: 'anime' }, { value: 'comedy' }]);
  });

  it('answers whether any row matches through a count', async () => {
    const tag = jsonTextElements(PLAYGROUND.tags, 'tag');

    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(sql`(select count(*) from ${tag.rows} where ${tag.value} in ('comedy')) > 0`),
    ).resolves.toEqual([{ name: 'Many' }]);
  });
});
