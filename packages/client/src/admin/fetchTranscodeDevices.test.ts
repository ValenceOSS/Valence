import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTranscodeDevices } from './fetchTranscodeDevices';

const device = {
  id: 'pci:0000:01:00.0',
  name: 'NVIDIA GeForce RTX 5080',
  vendor: 'nvidia',
  accels: ['nvenc'],
  probed: true,
  encoders: ['h264_nvenc', 'hevc_nvenc'],
  capacity: 8,
  streams: 2,
  busyPercent: 41.5,
  isOn: true,
  maxStreams: null,
  position: 0,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTranscodeDevices', () => {
  it('reads the devices, most preferred first', async () => {
    const fetching = vi.fn().mockResolvedValue(new Response(JSON.stringify({ devices: [device] })));

    vi.stubGlobal('fetch', fetching);

    await expect(fetchTranscodeDevices()).resolves.toEqual([device]);
    expect(fetching).toHaveBeenCalledWith('/api/admin/hardware/devices', expect.anything());
  });

  it('throws where the server refused', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));

    await expect(fetchTranscodeDevices()).rejects.toThrow();
  });
});
