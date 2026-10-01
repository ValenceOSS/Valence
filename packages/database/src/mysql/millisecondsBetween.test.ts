import { beforeAll, describe, expect, it } from 'vitest';
import { PLAYGROUND } from './PLAYGROUND';
import { aPlayground } from './aPlayground';
import { millisecondsBetween } from './millisecondsBetween';
import type { AnyDatabase } from './AnyDatabase';

let db: AnyDatabase;

beforeAll(async () => {
  db = await aPlayground();
  await db.insert(PLAYGROUND).values({
    id: 'a',
    name: 'Timed',
    startedAt: new Date('2026-09-30T12:00:00.000Z'),
    endedAt: new Date('2026-09-30T12:00:02.500Z'),
  });
}, 30_000);

describe('millisecondsBetween', () => {
  it('measures the time between two moments', async () => {
    await expect(
      db
        .select({ took: millisecondsBetween(PLAYGROUND.endedAt, PLAYGROUND.startedAt) })
        .from(PLAYGROUND),
    ).resolves.toEqual([{ took: 2500 }]);
  });
});
