import { z } from 'zod';

const TRANSCODE_DEVICE_VENDORS = ['nvidia', 'amd', 'intel', 'apple', 'other'] as const;

const TranscodeDeviceVendorSchema = z.enum(TRANSCODE_DEVICE_VENDORS);

const TranscodeDeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  vendor: TranscodeDeviceVendorSchema,
  accels: z.array(z.string()).default([]),
  probed: z.boolean().default(false),
  encoders: z.array(z.string()).default([]),
  capacity: z.number().int().nonnegative().default(0),
  streams: z.number().int().nonnegative().default(0),
  busyPercent: z.number().nonnegative().nullable().default(null),
});

const PlacedDeviceSchema = TranscodeDeviceSchema.extend({
  isOn: z.boolean(),
  maxStreams: z.number().int().positive().nullable(),
  position: z.number().int().nonnegative(),
});

type TranscodeDeviceVendor = z.infer<typeof TranscodeDeviceVendorSchema>;

type TranscodeDevice = z.infer<typeof TranscodeDeviceSchema>;

type PlacedDevice = z.infer<typeof PlacedDeviceSchema>;

export type { PlacedDevice, TranscodeDevice, TranscodeDeviceVendor };

export {
  PlacedDeviceSchema,
  TRANSCODE_DEVICE_VENDORS,
  TranscodeDeviceSchema,
  TranscodeDeviceVendorSchema,
};
