import { z } from 'zod';

const PlaybackHardwareSchema = z.object({
  deviceId: z.string(),
  deviceName: z.string(),
  accel: z.string(),
});

type PlaybackHardware = z.infer<typeof PlaybackHardwareSchema>;

export type { PlaybackHardware };

export { PlaybackHardwareSchema };
