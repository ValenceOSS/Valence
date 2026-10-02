import { z } from 'zod';

const SeerrArrServerSchema = z.object({
  id: z.number().int(),
  name: z.string().default(''),
  hostname: z.string(),
  port: z.number().int(),
  apiKey: z.string(),
  useSsl: z.boolean().default(false),
  baseUrl: z.string().nullish(),
  activeProfileId: z.number().int().nullish(),
  activeDirectory: z.string().nullish(),
  is4k: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

type SeerrArrServer = z.infer<typeof SeerrArrServerSchema>;

export type { SeerrArrServer };

export { SeerrArrServerSchema };
