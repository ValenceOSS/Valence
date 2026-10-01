import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { countAffected } from './countAffected';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

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

  it('counts a row the write matched and left as it was', async () => {
    expect(countAffected(await db.update(PLAYGROUND).set({ note: 'seen' }))).toBe(2);
  });

  it('reads the header mysql2 hands back', () => {
    expect(countAffected([{ affectedRows: 3 }, undefined])).toBe(3);
    expect(() => countAffected({ rowCount: 3 })).toThrow();
  });
});
