import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from '#dialect/PLAYGROUND';
import { aPlayground } from '#dialect/aPlayground';
import { concatenated } from './concatenated';
import type { AnyDatabase } from '#dialect/AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values([
    { id: 'a', name: 'Films', note: 'Arrival.mkv' },
    { id: 'b', name: 'Shows' },
  ]);
}, 30_000);

describe('concatenated', () => {
  it('joins pieces of text, reading a missing one as empty', async () => {
    const rows = await db
      .select({ path: concatenated(PLAYGROUND.name, '/', PLAYGROUND.note) })
      .from(PLAYGROUND)
      .orderBy(PLAYGROUND.id);

    expect(rows).toEqual([{ path: 'Films/Arrival.mkv' }, { path: 'Shows/' }]);
  });
});
