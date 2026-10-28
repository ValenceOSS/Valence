import { describe, expect, it, vi } from 'vitest';
import { sendPlacement } from './sendPlacement';

const spreading = () =>
  Promise.resolve({
    spreadAcrossDevices: true,
    hardwareDevices: [{ id: 'a', isOn: true, maxStreams: 2 }],
    whenDevicesFull: 'software' as const,
  });

const found = {
  id: 'a',
  name: 'A',
  vendor: 'intel' as const,
  accels: ['qsv'],
  probed: false,
  encoders: [],
  capacity: 0,
  streams: 0,
  busyPercent: null,
};

describe('sendPlacement', () => {
  it('tells the media service where sessions may go', async () => {
    const setPlacement = vi.fn().mockResolvedValue(undefined);

    await sendPlacement(
      spreading,
      { listDevices: () => Promise.resolve([found]), setPlacement },
      vi.fn(),
    );

    expect(setPlacement).toHaveBeenCalledWith({
      devices: [{ id: 'a', maxStreams: 2 }],
      whenFull: 'software',
    });
  });

  it('says why where the media service could not be told, rather than failing', async () => {
    const warn = vi.fn();

    await expect(
      sendPlacement(
        spreading,
        {
          listDevices: () => Promise.resolve([found]),
          setPlacement: () => Promise.reject(new Error('refused')),
        },
        warn,
      ),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('refused'));
  });

  it('does nothing with a media service that cannot place sessions', async () => {
    const listDevices = vi.fn();

    await sendPlacement(spreading, { listDevices }, vi.fn());

    expect(listDevices).not.toHaveBeenCalled();
  });
});
