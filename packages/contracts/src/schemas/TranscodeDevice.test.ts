import { describe, expect, it } from 'vitest';
import { PlacedDeviceSchema, TranscodeDeviceSchema } from './TranscodeDevice';

describe('TranscodeDeviceSchema', () => {
  it('reads a device the media service has not checked yet', () => {
    expect(
      TranscodeDeviceSchema.parse({ id: 'pci:0000:01:00.0', name: 'RTX 5080', vendor: 'nvidia' }),
    ).toEqual({
      id: 'pci:0000:01:00.0',
      name: 'RTX 5080',
      vendor: 'nvidia',
      accels: [],
      probed: false,
      encoders: [],
      capacity: 0,
      streams: 0,
      busyPercent: null,
    });
  });

  it('refuses a maker it does not know', () => {
    expect(
      TranscodeDeviceSchema.safeParse({ id: 'a', name: 'A', vendor: 'qualcomm' }).success,
    ).toBe(false);
  });
});

describe('PlacedDeviceSchema', () => {
  it('carries where the device stands and how much it may take', () => {
    expect(
      PlacedDeviceSchema.parse({
        id: 'a',
        name: 'A',
        vendor: 'intel',
        isOn: false,
        maxStreams: 2,
        position: 1,
      }),
    ).toMatchObject({ isOn: false, maxStreams: 2, position: 1 });
  });
});
