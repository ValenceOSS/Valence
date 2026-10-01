import { eq, sql } from 'drizzle-orm';
import { MySqlDialect } from 'drizzle-orm/mysql-core';
import { describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { incoming } from './incoming';

describe('incoming', () => {
  it('names the value an upsert was about to write', () => {
    expect(new MySqlDialect().sqlToQuery(incoming(PLAYGROUND.count)).sql).toBe('values(`count`)');
  });

  it('reads it back on a row already there', async () => {
    const db = await aPlayground();

    await db.insert(PLAYGROUND).values({ id: 'a', name: 'Incoming', count: 2 });
    await db
      .insert(PLAYGROUND)
      .values({ id: 'b', name: 'Incoming', count: 3 })
      .onDuplicateKeyUpdate({
        set: { count: sql`${PLAYGROUND.count} + ${incoming(PLAYGROUND.count)}` },
      });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Incoming')),
    ).resolves.toMatchObject([{ id: 'a', count: 5 }]);
  }, 30_000);
});
