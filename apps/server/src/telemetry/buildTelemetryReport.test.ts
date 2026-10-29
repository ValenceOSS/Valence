import { describe, expect, it } from 'vitest';
import { TranscodeDeviceSchema } from '@ValenceContracts/schemas/TranscodeDevice';
import { buildTelemetryReport } from './buildTelemetryReport';
import type { TelemetryReading } from './buildTelemetryReport';

const GIGABYTE = 1024 ** 3;

const READING: TelemetryReading = {
  installId: '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41',
  version: '1.8.0',
  installMethod: 'docker',
  os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
  cores: Array.from({ length: 16 }, () => ({ model: 'AMD Ryzen 7 9800X3D' })),
  totalMemoryBytes: 62 * GIGABYTE,
  devices: [
    TranscodeDeviceSchema.parse({ id: 'gpu0', name: 'GeForce RTX 5080', vendor: 'nvidia' }),
  ],
  accels: ['nvenc', 'vaapi'],
  database: 'postgres',
  library: { films: 412, episodes: 5120, tracks: 0, books: 3 },
  clients: { browser: 2, desktop: 0, tv: 1, phone: 0 },
};

describe('buildTelemetryReport', () => {
  it('bands every count and names only what the report describes', () => {
    expect(buildTelemetryReport(READING)).toEqual({
      schemaVersion: 1,
      installId: '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41',
      version: '1.8.0',
      installMethod: 'docker',
      os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
      cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 16 },
      memoryGb: '64-128',
      gpus: [{ vendor: 'nvidia', model: 'GeForce RTX 5080' }],
      accels: ['nvenc', 'vaapi'],
      database: 'postgres',
      library: { films: '100-999', episodes: '1000-9999', tracks: '0', books: '1-9' },
      clients: { browser: '1-9', tv: '1-9' },
    });
  });

  it('carries no field the report does not describe', () => {
    expect(Object.keys(buildTelemetryReport(READING)).toSorted()).toEqual([
      'accels',
      'clients',
      'cpu',
      'database',
      'gpus',
      'installId',
      'installMethod',
      'library',
      'memoryGb',
      'os',
      'schemaVersion',
      'version',
    ]);
  });

  it('refuses to build a report without a random install id', () => {
    expect(() => buildTelemetryReport({ ...READING, installId: '' })).toThrow();
  });
});
