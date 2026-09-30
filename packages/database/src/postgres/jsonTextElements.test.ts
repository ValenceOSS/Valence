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
});
