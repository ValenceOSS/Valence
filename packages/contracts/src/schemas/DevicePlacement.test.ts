import { describe, expect, it } from 'vitest';
import { HardwareDeviceSettingsSchema, WhenDevicesFullSchema } from './DevicePlacement';

describe('HardwareDeviceSettingsSchema', () => {
  it('reads devices in the order they are preferred', () => {
    expect(
      HardwareDeviceSettingsSchema.parse([
        { id: 'pci:0000:01:00.0', isOn: true, maxStreams: 4 },
        { id: 'pci:0000:00:02.0', isOn: false, maxStreams: null },
      ]),
    ).toEqual([
      { id: 'pci:0000:01:00.0', isOn: true, maxStreams: 4 },
      { id: 'pci:0000:00:02.0', isOn: false, maxStreams: null },
    ]);
  });

  it('refuses a device that may take no streams at all', () => {
    expect(
      HardwareDeviceSettingsSchema.safeParse([{ id: 'a', isOn: true, maxStreams: 0 }]).success,
    ).toBe(false);
  });
});

describe('WhenDevicesFullSchema', () => {
  it('knows only software and the preferred device', () => {
    expect(WhenDevicesFullSchema.options).toEqual(['software', 'preferred']);
    expect(WhenDevicesFullSchema.safeParse('anywhere').success).toBe(false);
  });
});
