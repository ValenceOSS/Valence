import { z } from 'zod';

const LinkSettingsSchema = z.object({
  privateKey: z.string().default(''),
  publicKey: z.string().default(''),
  name: z.string().default(''),
  colour: z.string().default(''),
  address: z.string().default(''),
});

const LINK_SETTINGS_DEFAULTS = LinkSettingsSchema.parse({});

type LinkSettings = z.infer<typeof LinkSettingsSchema>;

export type { LinkSettings };

export { LINK_SETTINGS_DEFAULTS, LinkSettingsSchema };
