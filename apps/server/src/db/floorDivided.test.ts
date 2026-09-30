import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { floorDivided } from './floorDivided';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Seven', count: 7 });
}, 30_000);

describe('floorDivided', () => {
  it('keeps only the whole part', async () => {
    await expect(
      db.select({ halves: floorDivided(PLAYGROUND.count, 2) }).from(PLAYGROUND),
    ).resolves.toEqual([{ halves: 3 }]);
  });
});
