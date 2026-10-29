import { describe, expect, it, vi } from 'vitest';
import { TelemetryReportSchema } from '@ValenceContracts/schemas/TelemetryReport';
import { sendTelemetryReport } from './sendTelemetryReport';

const REPORT = TelemetryReportSchema.parse({
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
});

const ADDRESS = 'https://metrics.getvalence.app/api/v1/reports';

describe('sendTelemetryReport', () => {
  it('posts the report as JSON, saying which release sent it', async () => {
    const fetching = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response(null, { status: 202 })),
    );

    await expect(
      sendTelemetryReport({ address: ADDRESS, report: REPORT, version: '1.8.0', fetch: fetching }),
    ).resolves.toEqual({ isSent: true });

    const [address, init] = fetching.mock.calls[0] ?? [];

    expect(address).toBe(ADDRESS);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({
      'content-type': 'application/json',
      'user-agent': 'Valence/1.8.0',
    });
    expect(TelemetryReportSchema.parse(JSON.parse(typeof init?.body === 'string' ? init.body : ''))).toEqual(REPORT);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('tells back the status the metrics server refused it with', async () => {
    const fetching = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response('no', { status: 429 })),
    );

    await expect(
      sendTelemetryReport({ address: ADDRESS, report: REPORT, version: '1.8.0', fetch: fetching }),
    ).resolves.toEqual({ isSent: false, problem: '429' });
  });

  it('tells back why it could not reach the metrics server, rather than throwing', async () => {
    const fetching = vi.fn<typeof fetch>(() => Promise.reject(new Error('getaddrinfo ENOTFOUND')));

    await expect(
      sendTelemetryReport({ address: ADDRESS, report: REPORT, version: '1.8.0', fetch: fetching }),
    ).resolves.toEqual({ isSent: false, problem: 'getaddrinfo ENOTFOUND' });
  });
});
