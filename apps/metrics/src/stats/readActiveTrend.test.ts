import { describe, expect, it } from 'vitest';
import { recordReport } from '@ValenceMetrics/reports/recordReport';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { readActiveTrend } from './readActiveTrend';

const ANOTHER = '0b5f1c4e-58a5-4a3b-9a6f-2a8f0a8f6c11';

describe('readActiveTrend', () => {
  it('counts, for each day, the installs seen in the thirty days up to it', async () => {
    const db = await aMigratedDatabase();

    await recordReport(db, aReport(), new Date('2026-09-01T12:00:00Z'));
    await recordReport(db, aReport(), new Date('2026-09-02T12:00:00Z'));
    await recordReport(db, aReport({ installId: ANOTHER }), new Date('2026-09-02T12:00:00Z'));

    const trend = await readActiveTrend(db, '2026-10-02', 33);

    expect(trend).toHaveLength(33);
    expect(trend[0]).toStrictEqual({ day: '2026-08-31', installs: 0 });
    expect(trend[1]).toStrictEqual({ day: '2026-09-01', installs: 1 });
    expect(trend[2]).toStrictEqual({ day: '2026-09-02', installs: 2 });
    expect(trend.at(-2)).toStrictEqual({ day: '2026-10-01', installs: 2 });
    expect(trend.at(-1)).toStrictEqual({ day: '2026-10-02', installs: 0 });
  });
});
