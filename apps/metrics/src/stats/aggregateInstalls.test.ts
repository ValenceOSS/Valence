import { describe, expect, it } from 'vitest';
import { installRowOf } from '@ValenceMetrics/reports/installRowOf';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { aggregateInstalls } from './aggregateInstalls';
import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';
import type { InstallSummary } from './InstallSummary';

const NOW = new Date('2026-10-29T12:00:00Z');

const anInstall = (over: Partial<TelemetryReport> = {}, lastSeen = NOW): InstallSummary => {
  const row = installRowOf(aReport(over));

  return {
    lastSeen,
    version: row.version,
    installMethod: row.installMethod,
    platform: row.platform,
    arch: row.arch,
    cpuModel: row.cpuModel,
    cores: row.cores,
    memoryGb: row.memoryGb,
    database: row.database,
    gpus: row.gpus,
    accels: row.accels,
    library: row.library,
    clients: row.clients,
  };
};

const TREND = [{ day: '2026-10-29', installs: 4 }];

describe('aggregateInstalls', () => {
  it('shows only the count until there are three installs', () => {
    const stats = aggregateInstalls({
      installs: [anInstall(), anInstall()],
      trend: TREND,
      now: NOW,
    });

    expect(stats.activeInstalls).toBe(2);
    expect(stats.isEnoughToShow).toBe(false);
    expect(stats.versions).toStrictEqual([]);
    expect(stats.library.films).toStrictEqual([]);
  });

  it('sums the installs up into shares', () => {
    const stats = aggregateInstalls({
      installs: [
        anInstall(),
        anInstall(),
        anInstall({ gpus: [], accels: [] }, new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000)),
        anInstall({
          gpus: [
            { vendor: 'nvidia', model: 'NVIDIA GeForce RTX 3060' },
            { vendor: 'intel', model: ' ' },
          ],
          accels: ['NVENC', 'qsv'],
          clients: { phone: '1-9', browser: '0' },
        }),
      ],
      trend: TREND,
      now: NOW,
    });

    expect(stats.generatedAt).toBe(NOW.toISOString());
    expect(stats.activeInstalls).toBe(4);
    expect(stats.reportedToday).toBe(3);
    expect(stats.isEnoughToShow).toBe(true);
    expect(stats.trend).toStrictEqual(TREND);
    expect(stats.versions).toStrictEqual([{ id: '0.9.0', label: '0.9.0', installs: 4, share: 1 }]);
    expect(stats.platforms[0]?.label).toBe('Linux');
    expect(stats.architectures[0]?.label).toBe('x86-64');
    expect(stats.installMethods[0]?.label).toBe('Docker');
    expect(stats.databases[0]?.label).toBe('PostgreSQL');
    expect(stats.cpuVendors[0]?.label).toBe('AMD');
    expect(stats.cores[0]?.label).toBe('9 to 16 cores');
    expect(stats.memory[0]?.label).toBe('16 to 32 GB');
    expect(stats.gpuVendors).toStrictEqual([
      { id: 'nvidia', label: 'NVIDIA', installs: 3, share: 0.75 },
      { id: 'other', label: 'Other', installs: 2, share: 0.5 },
    ]);
    expect(stats.gpuModels).toStrictEqual([
      { id: 'NVIDIA GeForce RTX 3060', label: 'NVIDIA GeForce RTX 3060', installs: 3, share: 0.75 },
    ]);
    expect(stats.accels[0]).toStrictEqual({
      id: 'nvenc',
      label: 'NVENC',
      installs: 3,
      share: 0.75,
    });
    expect(stats.clients).toStrictEqual([
      { id: 'browser', label: 'A web browser', installs: 3, share: 0.75 },
      { id: 'tv', label: 'A television', installs: 3, share: 0.75 },
      { id: 'other', label: 'Other', installs: 1, share: 0.25 },
    ]);
    expect(stats.library.films[0]?.label).toBe('100 to 999');
    expect(stats.library.episodes[0]?.label).toBe('1,000 to 9,999');
    expect(stats.library.tracks[0]?.label).toBe('None');
    expect(stats.library.books[0]?.label).toBe('1 to 9');
  });
});
