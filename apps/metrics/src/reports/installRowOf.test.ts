import { describe, expect, it } from 'vitest';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { installRowOf } from './installRowOf';

describe('installRowOf', () => {
  it('lays a report out as the columns it is grouped by, beside the report itself', () => {
    const report = aReport();

    expect(installRowOf(report)).toStrictEqual({
      installId: report.installId,
      report,
      version: '0.9.0',
      installMethod: 'docker',
      platform: 'linux',
      arch: 'x64',
      cpuModel: 'AMD Ryzen 7 5800X 8-Core Processor',
      cores: 16,
      memoryGb: '16-32',
      database: 'postgres',
      gpus: report.gpus,
      accels: ['nvenc'],
      library: report.library,
      clients: report.clients,
    });
  });
});
