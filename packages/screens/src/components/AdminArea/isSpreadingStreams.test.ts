import { describe, expect, it } from 'vitest';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';
import { isSpreadingStreams } from './isSpreadingStreams';

const device = (id: string, streams: number): PlacedDevice => ({
  id,
  name: id,
  vendor: 'other',
  accels: [],
  probed: true,
  encoders: [],
  capacity: 4,
  streams,
  busyPercent: null,
  isOn: true,
  maxStreams: null,
  position: 0,
});

describe('isSpreadingStreams', () => {
  it('is spreading where more than one device is encoding', () => {
    expect(isSpreadingStreams([device('a', 1), device('b', 2)], false)).toBe(true);
  });

  it('is spreading where it is switched on with more than one device', () => {
    expect(isSpreadingStreams([device('a', 0), device('b', 0)], true)).toBe(true);
  });

  it('is not spreading with one device busy and spreading off', () => {
    expect(isSpreadingStreams([device('a', 3), device('b', 0)], false)).toBe(false);
  });

  it('is not spreading with a single device, even switched on', () => {
    expect(isSpreadingStreams([device('a', 3)], true)).toBe(false);
  });
});
