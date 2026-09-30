import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { nullsLast } from './nullsLast';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';

let db: AnyValenceDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'B', note: 'b' },
    { id: 'b', name: 'Missing' },
    { id: 'c', name: 'A', note: 'a' },
  ]);
}, 30_000);

describe('nullsLast', () => {
  it('puts the rows with nothing after the rest, largest first', async () => {
    const rows = await db
      .select({ name: PLAYGROUND.name })
      .from(PLAYGROUND)
      .orderBy(nullsLast(PLAYGROUND.note, 'desc'));

    expect(rows.map((row) => row.name)).toEqual(['B', 'A', 'Missing']);
  });

  it('and smallest first', async () => {
    const rows = await db
      .select({ name: PLAYGROUND.name })
      .from(PLAYGROUND)
      .orderBy(nullsLast(PLAYGROUND.note, 'asc'));

    expect(rows.map((row) => row.name)).toEqual(['A', 'B', 'Missing']);
  });
});
