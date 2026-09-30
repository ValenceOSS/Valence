import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';

describe('aPlayground', () => {
  it('opens an empty table to try things against', async () => {
    const db = await aPlayground();

    await db.insert(PLAYGROUND).values({ id: 'a', name: 'Arrival' });

    await expect(db.select().from(PLAYGROUND)).resolves.toMatchObject([{ id: 'a', count: 0 }]);
  }, 30_000);
});
