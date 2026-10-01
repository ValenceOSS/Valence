import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { truth } from './truth';
import type { AnyDatabase } from '#dialect/AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Counted', count: 2 },
    { id: 'b', name: 'Empty', count: 0 },
  ]);
}, 30_000);

describe('truth', () => {
  it('reads a condition written by hand as a boolean', async () => {
    const rows = await db
      .select({ name: PLAYGROUND.name, has: truth(sql`${PLAYGROUND.count} > 0`) })
      .from(PLAYGROUND)
      .orderBy(PLAYGROUND.id);

    expect(rows).toEqual([
      { name: 'Counted', has: true },
      { name: 'Empty', has: false },
    ]);
  });
});
