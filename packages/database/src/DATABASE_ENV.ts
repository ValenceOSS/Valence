import { z } from 'zod';

const DATABASE_ENV = {
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL: z.enum(['off', 'require', 'verify-full']).default('off'),
  DATABASE_SSL_CA: z.string().min(1).optional(),
};

export { DATABASE_ENV };
