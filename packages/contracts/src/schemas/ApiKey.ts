import { z } from 'zod';
import { PermissionSchema } from './Permission';

const ApiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  start: z.string().nullable(),
  enabled: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
  lastRequestAt: z.string().datetime().nullable(),
  requestCount: z.number().int().nonnegative(),
  permissions: z.array(PermissionSchema).nullable(),
  rateLimit: z
    .object({ max: z.number().int().positive(), everySeconds: z.number().int().positive() })
    .nullable(),
  createdAt: z.string().datetime(),
});

const CreatedApiKeySchema = ApiKeySchema.extend({ key: z.string() });

type ApiKey = z.infer<typeof ApiKeySchema>;
type CreatedApiKey = z.infer<typeof CreatedApiKeySchema>;
export type { ApiKey, CreatedApiKey };

export { ApiKeySchema, CreatedApiKeySchema };
