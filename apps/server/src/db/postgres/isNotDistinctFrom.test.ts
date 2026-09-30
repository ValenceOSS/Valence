import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { isNotDistinctFrom } from './isNotDistinctFrom';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Noted', note: 'yes' },
    { id: 'b', name: 'Unnoted' },
  ]);
}, 30_000);

describe('isNotDistinctFrom', () => {
  it('finds a missing value when asked for nothing, which = never does', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(isNotDistinctFrom(PLAYGROUND.note, null)),
    ).resolves.toEqual([{ name: 'Unnoted' }]);
  });

  it('still matches a value that is there', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(isNotDistinctFrom(PLAYGROUND.note, 'yes')),
    ).resolves.toEqual([{ name: 'Noted' }]);
  });
});
