import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { insertUnlessPresent } from './insertUnlessPresent';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
}, 30_000);

describe('insertUnlessPresent', () => {
  it('writes a row that is not there', async () => {
    await insertUnlessPresent(db, PLAYGROUND, {
      values: [{ id: 'a', name: 'Kept new' }],
      target: PLAYGROUND.name,
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Kept new')),
    ).resolves.toHaveLength(1);
  });

  it('leaves the row already there exactly as it was', async () => {
    await insertUnlessPresent(db, PLAYGROUND, {
      values: [{ id: 'b', name: 'Kept once', note: 'first' }],
      target: PLAYGROUND.name,
    });
    await insertUnlessPresent(db, PLAYGROUND, {
      values: [{ id: 'c', name: 'Kept once', note: 'second' }],
      target: PLAYGROUND.name,
    });

    await expect(
      db.select().from(PLAYGROUND).where(eq(PLAYGROUND.name, 'Kept once')),
    ).resolves.toMatchObject([{ id: 'b', note: 'first' }]);
  });
});
