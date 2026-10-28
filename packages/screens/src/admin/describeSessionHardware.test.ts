import { describe, expect, it } from 'vitest';
import { describeSessionHardware } from './describeSessionHardware';

describe('describeSessionHardware', () => {
  it('names the card and the backend it is encoded with', () => {
    expect(
      describeSessionHardware({
        deviceId: 'pci:0000:01:00.0',
        deviceName: 'NVIDIA GeForce RTX 5080',
        accel: 'nvenc',
      }),
    ).toBe('RTX 5080 · NVENC');
  });
});
