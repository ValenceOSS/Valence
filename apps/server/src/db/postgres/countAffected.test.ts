import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { countAffected } from './countAffected';
import type { AnyValenceDatabase } from './AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Counted a' },
    { id: 'b', name: 'Counted b' },
  ]);
}, 30_000);

describe('countAffected', () => {
  it('counts the rows a write changed', async () => {
    expect(countAffected(await db.update(PLAYGROUND).set({ note: 'seen' }))).toBe(2);
  });

  it('counts none where nothing matched', async () => {
    expect(countAffected(await db.delete(PLAYGROUND).where(eq(PLAYGROUND.name, 'Nobody')))).toBe(0);
  });

  it('reads node-postgres, which names the count rowCount', () => {
    expect(countAffected({ rowCount: 3 })).toBe(3);
    expect(countAffected({ rowCount: null })).toBe(0);
  });
});
