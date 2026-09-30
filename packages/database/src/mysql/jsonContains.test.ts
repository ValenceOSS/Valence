import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { jsonContains } from './jsonContains';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Tagged', tags: ['anime', 'comedy'] },
    { id: 'b', name: 'Other', tags: ['drama'] },
  ]);
}, 30_000);

describe('jsonContains', () => {
  it('finds the rows whose array holds the value', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(jsonContains(PLAYGROUND.tags, ['comedy'])),
    ).resolves.toEqual([{ name: 'Tagged' }]);
  });
});
