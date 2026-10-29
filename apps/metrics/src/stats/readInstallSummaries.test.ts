import { describe, expect, it } from 'vitest';
import { recordReport } from '@ValenceMetrics/reports/recordReport';
import { aMigratedDatabase } from '@ValenceMetrics/testing/aMigratedDatabase';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { readInstallSummaries } from './readInstallSummaries';

describe('readInstallSummaries', () => {
  it('reads only the installs that reported since the given moment', async () => {
    const db = await aMigratedDatabase();

    await recordReport(db, aReport(), new Date('2026-09-01T00:00:00Z'));
    await recordReport(
      db,
      aReport({ installId: '0b5f1c4e-58a5-4a3b-9a6f-2a8f0a8f6c11', version: '0.9.1' }),
      new Date('2026-10-28T00:00:00Z'),
    );

    const summaries = await readInstallSummaries(db, new Date('2026-10-01T00:00:00Z'));

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.version).toBe('0.9.1');
    expect(summaries[0]?.cpuModel).toBe('AMD Ryzen 7 5800X 8-Core Processor');
    expect(summaries[0]?.clients).toStrictEqual({ browser: '1-9', tv: '1-9' });
  });
});
