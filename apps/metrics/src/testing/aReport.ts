import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

/**
 * A report that keeps to the contract, with whatever a test wants changed in it.
 *
 * @param over - What to change.
 * @returns The report.
 */
const aReport = (over: Partial<TelemetryReport> = {}): TelemetryReport => ({
  schemaVersion: 1,
  installId: '7d0b3c7e-2f0a-4c55-9d43-1c7a7a3e9b10',
  version: '0.9.0',
  installMethod: 'docker',
  os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
  cpu: { model: ' AMD Ryzen 7 5800X 8-Core Processor ', cores: 16 },
  memoryGb: '16-32',
  gpus: [{ vendor: 'nvidia', model: 'NVIDIA GeForce RTX 3060' }],
  accels: ['nvenc'],
  database: 'postgres',
  library: { films: '100-999', episodes: '1000-9999', tracks: '0', books: '1-9' },
  clients: { browser: '1-9', tv: '1-9' },
  ...over,
});

export { aReport };
