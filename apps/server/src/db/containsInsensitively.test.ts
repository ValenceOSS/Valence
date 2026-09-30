import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { containsInsensitively } from './containsInsensitively';
import { likeLiterally } from './likeLiterally';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'The Dangers in My Heart' },
    { id: 'b', name: '100% Orange Juice' },
    { id: 'c', name: 'Arrival' },
  ]);
}, 30_000);

describe('containsInsensitively', () => {
  it('matches whatever the case of either side', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(containsInsensitively(PLAYGROUND.name, '%DANGERS%')),
    ).resolves.toEqual([{ name: 'The Dangers in My Heart' }]);
  });

  it('matches a percent sign as written once the text is escaped', async () => {
    await expect(
      db
        .select({ name: PLAYGROUND.name })
        .from(PLAYGROUND)
        .where(containsInsensitively(PLAYGROUND.name, `%${likeLiterally('0%')}%`)),
    ).resolves.toEqual([{ name: '100% Orange Juice' }]);
  });
});
