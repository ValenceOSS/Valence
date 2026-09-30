import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { random } from './random';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Chance' });
}, 30_000);

describe('random', () => {
  it('gives a number from 0 up to 1', async () => {
    const [row] = await db.select({ roll: random() }).from(PLAYGROUND);

    expect(row?.roll).toBeGreaterThanOrEqual(0);
    expect(row?.roll).toBeLessThan(1);
  });
});
