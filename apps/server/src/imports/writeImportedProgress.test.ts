import { describe, expect, it } from 'vitest';
import { watchProgress } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { writeImportedProgress } from './writeImportedProgress';

const MARCH = new Date('2026-03-04T21:00:00Z');

describe('writeImportedProgress', { timeout: 60_000 }, () => {
  it('writes where somebody got to, dated when they got there', async () => {
    const { db } = await aHousehold();

    expect(
      await writeImportedProgress(db, {
        profileId: 'pat',
        mediaItemId: 'film',
        positionSeconds: 600,
        durationSeconds: 5400,
        isFinished: false,
        at: MARCH,
      }),
    ).toBe(true);

    const [row] = await db.select().from(watchProgress);

    expect(row).toMatchObject({ positionSeconds: 600, isFinished: false, updatedAt: MARCH });
  });

  it('moves an older position on, and leaves one newer than the old server alone', async () => {
    const { db } = await aHousehold();
    const write = (at: Date, positionSeconds: number) =>
      writeImportedProgress(db, {
        profileId: 'pat',
        mediaItemId: 'film',
        positionSeconds,
        durationSeconds: 5400,
        isFinished: false,
        at,
      });

    await write(new Date('2026-01-01T00:00:00Z'), 100);
    expect(await write(MARCH, 600)).toBe(true);
    expect(await write(new Date('2026-02-01T00:00:00Z'), 50)).toBe(false);

    const rows = await db.select().from(watchProgress);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.positionSeconds).toBe(600);
  });
});
