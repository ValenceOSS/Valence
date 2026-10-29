import { describe, expect, it } from 'vitest';
import { TelemetryInstallIdSchema, TelemetryPreviewSchema } from './TelemetryPreview';

const A_REPORT = {
  schemaVersion: 1,
  installId: '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41',
  version: '1.8.0',
  installMethod: 'docker',
  os: { platform: 'linux', release: '6.8.0', arch: 'x64' },
  cpu: { model: 'AMD Ryzen 7 9800X3D', cores: 16 },
  memoryGb: '32-64',
  gpus: [],
  accels: [],
  database: 'postgres',
  library: { films: '0', episodes: '0', tracks: '0', books: '0' },
  clients: {},
};

describe('TelemetryPreviewSchema', () => {
  it('reads a report that is being sent', () => {
    const preview = {
      isSending: true,
      heldOffBy: null,
      address: 'https://metrics.getvalence.app/api/v1/reports',
      report: A_REPORT,
    };

    expect(TelemetryPreviewSchema.parse(preview)).toEqual(preview);
  });

  it('reads why a report is held back', () => {
    const preview = TelemetryPreviewSchema.parse({
      isSending: false,
      heldOffBy: 'environment',
      address: 'https://metrics.getvalence.app/api/v1/reports',
      report: A_REPORT,
    });

    expect(preview.heldOffBy).toBe('environment');
  });

  it('refuses a reason it does not know', () => {
    expect(
      TelemetryPreviewSchema.safeParse({
        isSending: false,
        heldOffBy: 'weather',
        address: '',
        report: A_REPORT,
      }).success,
    ).toBe(false);
  });
});

describe('TelemetryInstallIdSchema', () => {
  it('reads a random install id and refuses anything else', () => {
    expect(TelemetryInstallIdSchema.safeParse({ installId: A_REPORT.installId }).success).toBe(
      true,
    );
    expect(TelemetryInstallIdSchema.safeParse({ installId: 'home' }).success).toBe(false);
  });
});
