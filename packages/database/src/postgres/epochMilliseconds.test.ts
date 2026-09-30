import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { epochMilliseconds } from './epochMilliseconds';
import type { AnyDatabase } from './AnyDatabase';

const MOMENT = new Date('2026-09-30T12:34:56.789Z');

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({ id: 'a', name: 'Moment', startedAt: MOMENT });
}, 30_000);

describe('epochMilliseconds', () => {
  it('reads a moment as JavaScript counts time', async () => {
    await expect(
      db.select({ at: epochMilliseconds(PLAYGROUND.startedAt) }).from(PLAYGROUND),
    ).resolves.toEqual([{ at: MOMENT.getTime() }]);
  });
});
