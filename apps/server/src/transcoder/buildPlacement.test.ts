import { describe, expect, it } from 'vitest';
import type { TranscodeDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { buildPlacement } from './buildPlacement';

const device = (id: string): TranscodeDevice => ({
  id,
  name: id,
  vendor: 'other',
  accels: [],
  probed: false,
  encoders: [],
  capacity: 0,
  streams: 0,
  busyPercent: null,
});

describe('buildPlacement', () => {
  it('places nothing while sessions are not spread across devices', () => {
    expect(
      buildPlacement(
        { spreadAcrossDevices: false, hardwareDevices: [], whenDevicesFull: 'software' },
        [device('a'), device('b')],
      ),
    ).toBeNull();
  });

  it('places nothing where there are no devices', () => {
    expect(
      buildPlacement(
        { spreadAcrossDevices: true, hardwareDevices: [], whenDevicesFull: 'software' },
        [],
      ),
    ).toBeNull();
  });

  it('lists the devices switched on, most preferred first, then any found since', () => {
    expect(
      buildPlacement(
        {
          spreadAcrossDevices: true,
          hardwareDevices: [
            { id: 'b', isOn: true, maxStreams: 4 },
            { id: 'a', isOn: false, maxStreams: null },
          ],
          whenDevicesFull: 'preferred',
        },
        [device('a'), device('b'), device('c')],
      ),
    ).toEqual({
      devices: [
        { id: 'b', maxStreams: 4 },
        { id: 'c', maxStreams: null },
      ],
      whenFull: 'preferred',
    });
  });

  it('places nothing where every device is switched off', () => {
    expect(
      buildPlacement(
        {
          spreadAcrossDevices: true,
          hardwareDevices: [{ id: 'a', isOn: false, maxStreams: null }],
          whenDevicesFull: 'software',
        },
        [device('a')],
      ),
    ).toBeNull();
  });
});
