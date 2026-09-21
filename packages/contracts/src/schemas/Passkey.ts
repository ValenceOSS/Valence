import { z } from 'zod';

const PasskeySchema = z.object({
  id: z.string().min(1),
  name: z.string().nullish(),
  deviceType: z.string().nullish(),
  backedUp: z.boolean().nullish(),
  createdAt: z.string().nullish(),
});

export type Passkey = z.infer<typeof PasskeySchema>;

export { PasskeySchema };
