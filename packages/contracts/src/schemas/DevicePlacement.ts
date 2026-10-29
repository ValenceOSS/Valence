import { z } from 'zod';

const WHEN_DEVICES_FULL = ['software', 'preferred'] as const;

const MOST_STREAMS_PER_DEVICE = 64;

const WhenDevicesFullSchema = z.enum(WHEN_DEVICES_FULL);

const HardwareDeviceSettingSchema = z.object({
  id: z.string().min(1).max(200),
  isOn: z.boolean(),
  maxStreams: z.number().int().min(1).max(MOST_STREAMS_PER_DEVICE).nullable(),
});

const HardwareDeviceSettingsSchema = z.array(HardwareDeviceSettingSchema).max(32);

type WhenDevicesFull = z.infer<typeof WhenDevicesFullSchema>;

type HardwareDeviceSetting = z.infer<typeof HardwareDeviceSettingSchema>;

export type { HardwareDeviceSetting, WhenDevicesFull };

export {
  HardwareDeviceSettingSchema,
  HardwareDeviceSettingsSchema,
  MOST_STREAMS_PER_DEVICE,
  WHEN_DEVICES_FULL,
  WhenDevicesFullSchema,
};
