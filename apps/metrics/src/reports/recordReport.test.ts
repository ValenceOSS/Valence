import { describe, expect, it } from 'vitest';
import { dailyInstalls, installs } from '@ValenceMetrics/db/Schema';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { AN_HOUR, recordReport } from './recordReport';

const NOW = new Date('2026-10-29T12:00:00Z');

describe('recordReport', () => {
  it('keeps a first report and counts the install as seen today', async () => {
    const db = await aMigratedDatabase();

    expect(await recordReport(db, aReport(), NOW)).toBe('recorded');

    const [kept] = await db.select().from(installs);

    expect(kept?.firstSeen).toStrictEqual(NOW);
    expect(kept?.lastSeen).toStrictEqual(NOW);
    expect(kept?.version).toBe('0.9.0');
    expect(await db.select().from(dailyInstalls)).toStrictEqual([
      { day: '2026-10-29', installId: aReport().installId, version: '0.9.0' },
    ]);
  });

  it('turns away a second report inside the hour and changes nothing', async () => {
    const db = await aMigratedDatabase();

    await recordReport(db, aReport(), NOW);

    expect(
      await recordReport(db, aReport({ version: '0.9.1' }), new Date(NOW.getTime() + AN_HOUR - 1)),
    ).toBe('tooSoon');

    const [kept] = await db.select().from(installs);

    expect(kept?.version).toBe('0.9.0');
  });

  it('replaces the latest report once the hour is up, keeping when it was first seen', async () => {
    const db = await aMigratedDatabase();
    const later = new Date(NOW.getTime() + 25 * AN_HOUR);

    await recordReport(db, aReport(), NOW);

    expect(await recordReport(db, aReport({ version: '0.9.1' }), later)).toBe('recorded');

    const [kept] = await db.select().from(installs);

    expect(kept?.firstSeen).toStrictEqual(NOW);
    expect(kept?.lastSeen).toStrictEqual(later);
    expect(kept?.version).toBe('0.9.1');
    expect(await db.select().from(dailyInstalls)).toHaveLength(2);
  });
});
