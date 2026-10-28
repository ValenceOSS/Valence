import { describe, expect, it } from 'vitest';
import { PlaybackHardwareSchema } from './PlaybackHardware';

describe('PlaybackHardwareSchema', () => {
  it('reads the device a stream was placed on', () => {
    const placed = { deviceId: 'pci:0000:01:00.0', deviceName: 'RTX 5080', accel: 'nvenc' };

    expect(PlaybackHardwareSchema.parse(placed)).toEqual(placed);
  });

  it('refuses one that does not say which device', () => {
    expect(
      PlaybackHardwareSchema.safeParse({ deviceName: 'RTX 5080', accel: 'nvenc' }).success,
    ).toBe(false);
  });
});
