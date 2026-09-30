import { gt } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { countWhere } from './countWhere';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
}, 30_000);

describe('countWhere', () => {
  it('counts none, not nothing, in an empty table', async () => {
    await expect(
      db.select({ busy: countWhere(gt(PLAYGROUND.count, 0)) }).from(PLAYGROUND),
    ).resolves.toEqual([{ busy: 0 }]);
  });

  it('counts only the rows the condition holds for', async () => {
    await db.insert(PLAYGROUND).values([
      { id: 'a', name: 'Busy', count: 3 },
      { id: 'b', name: 'Idle', count: 0 },
      { id: 'c', name: 'Also busy', count: 1 },
    ]);

    await expect(
      db.select({ busy: countWhere(gt(PLAYGROUND.count, 0)) }).from(PLAYGROUND),
    ).resolves.toEqual([{ busy: 2 }]);
  });
});
