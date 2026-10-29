import { describe, expect, it } from 'vitest';
import { TelemetryReportSchema } from './TelemetryReport';

const A_REPORT = {
  schemaVersion: 1,
  installId: '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41',
  version: '1.8.0',
  installMethod: 'docker',
  os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
  cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 16 },
  memoryGb: '32-64',
  gpus: [{ vendor: 'nvidia', model: 'GeForce RTX 5080' }],
  accels: ['nvenc', 'vaapi'],
  database: 'postgres',
  library: { films: '100-999', episodes: '1000-9999', tracks: '0', books: '1-9' },
  clients: { browser: '1-9', tv: '1-9' },
};

describe('TelemetryReportSchema', () => {
  it('reads a whole report', () => {
    expect(TelemetryReportSchema.parse(A_REPORT)).toEqual(A_REPORT);
  });

  it('refuses an exact count where a bucket belongs', () => {
    expect(
      TelemetryReportSchema.safeParse({
        ...A_REPORT,
        library: { ...A_REPORT.library, films: '412' },
      }).success,
    ).toBe(false);
  });

  it('refuses a kind of app it does not know', () => {
    expect(
      TelemetryReportSchema.safeParse({ ...A_REPORT, clients: { watch: '1-9' } }).success,
    ).toBe(false);
  });

  it('refuses an install id that is not random', () => {
    expect(TelemetryReportSchema.safeParse({ ...A_REPORT, installId: 'my-server' }).success).toBe(
      false,
    );
  });
});
