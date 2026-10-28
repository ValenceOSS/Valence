import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveDevicePlacement } from './saveDevicePlacement';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveDevicePlacement', () => {
  it('sends only the parts that changed', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response('{}'));

    vi.stubGlobal('fetch', fetching);

    await expect(
      saveDevicePlacement({ hardwareDevices: [{ id: 'a', isOn: false, maxStreams: 2 }] }),
    ).resolves.toBe(true);
    expect(fetching).toHaveBeenCalledWith(
      '/api/admin/settings',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ hardwareDevices: [{ id: 'a', isOn: false, maxStreams: 2 }] }),
      }),
    );
  });

  it('says so where the server would not take it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 400 })));

    await expect(saveDevicePlacement({ spreadAcrossDevices: true })).resolves.toBe(false);
  });

  it('says so where the server could not be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(saveDevicePlacement({ whenDevicesFull: 'preferred' })).resolves.toBe(false);
  });
});
