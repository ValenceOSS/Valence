import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetTelemetryInstallId } from './resetTelemetryInstallId';

const ID = '7c1f6a2e-4b1d-4c39-9a57-0e2f5b8d9c41';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resetTelemetryInstallId', () => {
  it('asks the server for a new install id and reads it back', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify({ installId: ID })));

    vi.stubGlobal('fetch', fetching);

    await expect(resetTelemetryInstallId()).resolves.toEqual({
      kind: 'answered',
      value: { installId: ID },
    });
    expect(fetching).toHaveBeenCalledWith(
      '/api/admin/telemetry/reset-id',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('tells a refusal apart', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(resetTelemetryInstallId()).resolves.toMatchObject({ kind: 'refused' });
  });
});
