import { describe, expect, it, vi } from 'vitest';
import { readPlacement } from './readPlacement';

const found = {
  id: 'a',
  name: 'A',
  vendor: 'nvidia' as const,
  accels: ['nvenc'],
  probed: true,
  encoders: ['h264_nvenc'],
  capacity: 4,
  streams: 0,
  busyPercent: null,
};

describe('readPlacement', () => {
  it('does not ask for devices while sessions are not spread across them', async () => {
    const listDevices = vi.fn().mockResolvedValue([found]);

    await expect(
      readPlacement(
        () =>
          Promise.resolve({
            spreadAcrossDevices: false,
            hardwareDevices: [],
            whenDevicesFull: 'software',
          }),
        { listDevices },
      ),
    ).resolves.toBeNull();
    expect(listDevices).not.toHaveBeenCalled();
  });

  it('places sessions on the devices the media service found', async () => {
    await expect(
      readPlacement(
        () =>
          Promise.resolve({
            spreadAcrossDevices: true,
            hardwareDevices: [],
            whenDevicesFull: 'software',
          }),
        { listDevices: () => Promise.resolve([found]) },
      ),
    ).resolves.toEqual({ devices: [{ id: 'a', maxStreams: null }], whenFull: 'software' });
  });

  it('places nothing where the media service could not list its devices', async () => {
    await expect(
      readPlacement(
        () =>
          Promise.resolve({
            spreadAcrossDevices: true,
            hardwareDevices: [],
            whenDevicesFull: 'software',
          }),
        { listDevices: () => Promise.reject(new Error('down')) },
      ),
    ).resolves.toBeNull();
  });
});
