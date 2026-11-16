import { z } from 'zod';

const CastDeviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  model: z.string().nullable(),
});

const CastingNowSchema = z.object({
  state: z.enum(['unavailable', 'available', 'connecting', 'connected']),
  devices: z.array(CastDeviceSchema),
  device: CastDeviceSchema.nullable(),
});

export type CastDevice = z.infer<typeof CastDeviceSchema>;
export type CastingNow = z.infer<typeof CastingNowSchema>;
export { CastingNowSchema };
