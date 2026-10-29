import { describe, expect, it } from 'vitest';
import { recordReport } from '@ValenceMetrics/reports/recordReport';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { TREND_DAYS, readStats } from './readStats';

const IDS = [
  '0b5f1c4e-58a5-4a3b-9a6f-2a8f0a8f6c11',
  '1c6a2d5f-69b6-4b4c-8b7a-3b9a1b9a7d22',
  '2d7b3e6a-7ac7-4c5d-9c8b-4cab2cab8e33',
];

describe('readStats', () => {
  it('sums up the installs active in the last thirty days, with their trend', async () => {
    const db = await aMigratedDatabase();
    const now = new Date('2026-10-29T12:00:00Z');

    for (const installId of IDS) {
      await recordReport(db, aReport({ installId }), now);
    }

    await recordReport(db, aReport({ version: '0.1.0' }), new Date('2026-08-01T12:00:00Z'));

    const stats = await readStats(db, now);

    expect(stats.activeInstalls).toBe(3);
    expect(stats.versions).toStrictEqual([{ id: '0.9.0', label: '0.9.0', installs: 3, share: 1 }]);
    expect(stats.trend).toHaveLength(TREND_DAYS);
    expect(stats.trend.at(-1)).toStrictEqual({ day: '2026-10-29', installs: 3 });
  });
});
