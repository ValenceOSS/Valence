import { z } from 'zod';
import { DATABASE_ENV } from '@ValenceDatabase/DATABASE_ENV';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REQUESTS_PORT: z.coerce.number().int().positive().default(8421),
  DATABASE_URL: z.string().url().default('postgres://valence:valence@localhost:5432/valence'),
  ...DATABASE_ENV,
  REQUESTS_SECRET: z.string().min(32),
  VPN_URL: z
    .string()
    .default('')
    .transform((value) => value.trim().replace(/\/+$/, '')),
  VPN_API_KEY: z.string().default(''),
  VPN_CHECK_SECONDS: z.coerce.number().int().positive().default(30),
  VALENCE_VERSION: z.string().default('0.0.0'),
  DEFINITIONS_REPOSITORY: z.string().default('Prowlarr/Indexers'),
  DEFINITIONS_BRANCH: z.string().default('master'),
  DEFINITIONS_PATH: z.string().default('definitions/v11'),
  PUID: z.coerce.number().int().nonnegative().default(1000),
  PGID: z.coerce.number().int().nonnegative().default(1000),
  TRANSCODER_URL: z
    .string()
    .default('')
    .transform((value) => value.trim().replace(/\/+$/, '')),
  TRANSCODER_SECRET: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.string().min(32)]))
    .default(''),
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
