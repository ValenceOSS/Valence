import { z } from 'zod';
import { DATABASE_ENV } from '@ValenceDatabase/DATABASE_ENV';
import { defaultMediaJobs } from '@ValenceServer/env/defaultMediaJobs';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8420),
  DATABASE_URL: z.string().url().default('postgres://valence:valence@localhost:5432/valence'),
  ...DATABASE_ENV,
  MIGRATE_ON_START: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  BACKUP_BEFORE_MIGRATE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  BACKUP_DIR: z.string().min(1).default('/config/backups'),
  BACKUPS_KEPT: z.coerce.number().int().positive().default(3),
  BETTER_AUTH_SECRET: z.string().min(32).default('development-secret-change-me-in-production'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:8420'),
  TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  TRANSCODER_URL: z.string().min(1).default('unix:/run/valence-transcoder.sock'),
  TRANSCODER_SECRET: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.string().min(32)]))
    .default(''),
  REQUESTS_URL: z
    .string()
    .default('')
    .transform((value) => value.trim().replace(/\/+$/, '')),
  REQUESTS_SECRET: z.string().default(''),
  MEDIA_JOBS: z.coerce.number().int().positive().default(defaultMediaJobs()),
  CATALOGUE_API_KEY: z.string().default(''),
  IMAGE_CACHE_DIR: z.string().default('/cache/images'),
  PROFILE_IMAGE_DIR: z.string().default('/config/profiles'),
  VALENCE_VERSION: z.string().default('0.0.0'),
  VALENCE_COMMIT: z.string().optional(),
  VALENCE_PLUGIN_CATALOGUE_URL: z
    .string()
    .url()
    .default('https://valenceoss.github.io/valence-plugins/catalogue.json'),
  AUTH_RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  AUTH_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  ANNOUNCE_ON_NETWORK: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  SMTP_URL: z.string().default(''),
  SMTP_FROM: z.string().default(''),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Reads the process environment into a checked configuration, so a server that is misconfigured
 * fails at startup with a message naming the variable rather than at midnight with a type error.
 *
 * @param source - The process environment.
 * @returns The configuration, validated.
 */
const readEnv = (source: NodeJS.ProcessEnv): Env => EnvSchema.parse(source);

export type { Env };

export { readEnv };
