import { eq, sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { incoming } from './incoming';
import { upsert } from './upsert';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
}, 30_000);

describe('upsert', () => {
  it('writes a row that is not there yet', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'one', name: 'Upsert new', count: 1 }],
      target: PLAYGROUND.name,
      set: { count: 2 },
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert new')),
    ).resolves.toMatchObject([{ id: 'one', count: 1 }]);
  });

  it('changes the row already holding the key, rather than adding another', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'two', name: 'Upsert twice', count: 1 }],
      target: PLAYGROUND.name,
      set: { count: 1 },
    });
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'three', name: 'Upsert twice', count: 5 }],
      target: PLAYGROUND.name,
      set: { count: sql`${PLAYGROUND.count} + ${incoming(PLAYGROUND.count)}` },
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert twice')),
    ).resolves.toMatchObject([{ id: 'two', count: 6 }]);
  });

  it('honours a partial key given with its condition', async () => {
    await upsert(db, PLAYGROUND, {
      values: [{ id: 'four', name: 'Upsert partial' }],
      target: PLAYGROUND.name,
      set: { note: 'kept' },
      targetWhere: sql`true`,
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Upsert partial')),
    ).resolves.toHaveLength(1);
  });
});
