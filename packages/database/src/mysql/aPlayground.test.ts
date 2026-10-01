import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';

describe('aPlayground', () => {
  it('opens an empty table to try things against', async () => {
    const db = await aPlayground();

    await db.insert(PLAYGROUND).values({ id: 'a', name: 'Arrival' });

    await expect(db.select().from(PLAYGROUND)).resolves.toMatchObject([{ id: 'a', count: 0 }]);
  }, 30_000);

  it('gives every caller a database of its own', async () => {
    const one = await aPlayground();
    const other = await aPlayground();

    await one.insert(PLAYGROUND).values({ id: 'a', name: 'Only here' });

    await expect(other.select().from(PLAYGROUND)).resolves.toEqual([]);
  }, 30_000);

  it('refuses to guess which database to use', async () => {
    const url = process.env.MYSQL_TEST_URL;

    delete process.env.MYSQL_TEST_URL;

    try {
      await expect(aPlayground()).rejects.toThrow('MYSQL_TEST_URL');
    } finally {
      process.env.MYSQL_TEST_URL = url;
    }
  });
});
