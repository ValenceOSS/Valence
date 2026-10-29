import { describe, expect, it } from 'vitest';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { loadOfDevice } from './loadOfDevice';

const CARD: PlacedDevice = {
  id: 'a',
  name: 'A',
  vendor: 'nvidia',
  accels: ['nvenc'],
  probed: true,
  encoders: [],
  capacity: 8,
  streams: 2,
  busyPercent: null,
  isOn: true,
  maxStreams: null,
  position: 0,
};

describe('loadOfDevice', () => {
  it('reads what the device reports where it can', () => {
    expect(loadOfDevice({ ...CARD, busyPercent: 41.5 })).toBe(41.5);
  });

  it('counts streams against what it was measured to manage otherwise', () => {
    expect(loadOfDevice(CARD)).toBe(25);
  });

  it('reads a device of unknown capacity as idle', () => {
    expect(loadOfDevice({ ...CARD, capacity: 0 })).toBe(0);
  });

  it('never reads past full', () => {
    expect(loadOfDevice({ ...CARD, streams: 12 })).toBe(100);
  });
});
