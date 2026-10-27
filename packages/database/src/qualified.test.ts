import { beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { qualified } from './qualified';
import type { AnyDatabase } from '#dialect/AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'A', note: 'b' },
    { id: 'b', name: 'B', note: 'a' },
  ]);
}, 30_000);

describe('qualified', () => {
  it('names a column with its table where a query reads one table', () => {
    expect(
      db
        .select({ id: qualified(PLAYGROUND.id) })
        .from(PLAYGROUND)
        .toSQL().sql,
    ).toMatch(/playground.\.(.)id\1/u);
  });

  it('reaches the row around a subquery rather than the subquery’s own', async () => {
    const inner = sql`(select count(*) from ${PLAYGROUND} as inner_row where inner_row.note = ${qualified(PLAYGROUND.id)})`;
    const rows = await db
      .select({ id: PLAYGROUND.id, matches: sql<number>`${inner}`.mapWith(Number) })
      .from(PLAYGROUND)
      .orderBy(PLAYGROUND.id);

    expect(rows).toEqual([
      { id: 'a', matches: 1 },
      { id: 'b', matches: 1 },
    ]);
  });
});
