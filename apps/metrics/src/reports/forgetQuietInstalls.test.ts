import { describe, expect, it } from 'vitest';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { recordReport } from './recordReport';
import { A_YEAR, forgetQuietInstalls } from './forgetQuietInstalls';

const NOW = new Date('2026-10-29T12:00:00Z');

describe('forgetQuietInstalls', () => {
  it('deletes an install quiet for over a year, with the days it was counted', async () => {
    const db = await aMigratedDatabase();

    await recordReport(db, aReport(), new Date(NOW.getTime() - A_YEAR - 1));

    expect(await forgetQuietInstalls(db, NOW)).toBe(1);
    expect(await db.select().from(installs)).toStrictEqual([]);
    expect(await db.select().from(dailyInstalls)).toStrictEqual([]);
  });

  it('keeps an install heard from within the year', async () => {
    const db = await aMigratedDatabase();

    await recordReport(db, aReport(), new Date(NOW.getTime() - A_YEAR + 1));

    expect(await forgetQuietInstalls(db, NOW)).toBe(0);
    expect(await db.select().from(installs)).toHaveLength(1);
  });
});
