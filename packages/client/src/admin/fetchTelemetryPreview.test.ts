import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTelemetryPreview } from './fetchTelemetryPreview';

const PREVIEW = {
  isSending: false,
  heldOffBy: 'setting',
  address: 'https://metrics.getvalence.app/api/v1/reports',
  report: {
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
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTelemetryPreview', () => {
  it('reads the report from the admin endpoint', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify(PREVIEW)));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchTelemetryPreview()).resolves.toEqual(PREVIEW);
    expect(fetching).toHaveBeenCalledWith('/api/admin/telemetry/preview', expect.anything());
  });

  it('throws where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(fetchTelemetryPreview()).rejects.toThrow();
  });
});
