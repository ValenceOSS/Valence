import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REQUESTS_PORT: z.coerce.number().int().positive().default(8421),
  DATABASE_URL: z.string().url().default('postgres://valence:valence@localhost:5432/valence'),
  REQUESTS_SECRET: z.string().min(32),
  VPN_URL: z
    .string()
    .default('')
    .transform((value) => value.trim().replace(/\/+$/, '')),
  VPN_API_KEY: z.string().default(''),
  VPN_CHECK_SECONDS: z.coerce.number().int().positive().default(30),
  VALENCE_VERSION: z.string().default('0.0.0'),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Reads the process environment into a checked configuration, so a service that is misconfigured
 * fails at startup with a message naming the variable.
 *
 * @param source - The process environment.
 * @returns The configuration, validated.
 */
const readEnv = (source: NodeJS.ProcessEnv): Env => EnvSchema.parse(source);

export type { Env };

export { readEnv };
