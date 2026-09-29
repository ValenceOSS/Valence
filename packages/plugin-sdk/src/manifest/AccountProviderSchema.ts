import { z } from 'zod';
import { HttpsUrlSchema } from './HttpsUrlSchema';

const AccountProviderSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,31}$/),
  name: z.string().min(1).max(60),
  authorizeUrl: HttpsUrlSchema,
  tokenUrl: HttpsUrlSchema,
  scopes: z.array(z.string().min(1).max(100)).max(20),
  clientIdSetting: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/),
  clientSecretSetting: z
    .string()
    .regex(/^[a-z][a-zA-Z0-9]{0,39}$/)
    .optional(),
});

type AccountProvider = z.infer<typeof AccountProviderSchema>;

export type { AccountProvider };

export { AccountProviderSchema };
