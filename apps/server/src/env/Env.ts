import { z } from 'zod';
import { DATABASE_ENV } from '@ValenceDatabase/DATABASE_ENV';
import { defaultMediaJobs } from '@ValenceServer/env/defaultMediaJobs';
import { say } from '@ValenceI18n/say';

const DEVELOPMENT_SECRET = 'development-secret-change-me-in-production';

const PLACEHOLDER_MARK = 'change-me';

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
  CHECK_FOR_UPDATES: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
  BETTER_AUTH_SECRET: z
    .union([z.literal('').transform(() => DEVELOPMENT_SECRET), z.string().min(32)])
    .default(DEVELOPMENT_SECRET),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:8420'),
  DEMO_ACCOUNTS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((username) => username.trim().toLowerCase())
        .filter((username) => username.length > 0),
    ),
  TRUSTED_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  TRUSTED_PROXIES: z
    .string()
    .default('127.0.0.0/8, ::1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7')
    .transform((value) =>
      value
        .split(',')
        .map((range) => range.trim())
        .filter((range) => range.length > 0),
    ),
  COOKIE_SECURE: z
    .enum(['true', 'false', ''])
    .optional()
    .transform((value) => (value === undefined || value === '' ? undefined : value === 'true')),
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
  LIVE_TV_PROXY: z
    .string()
    .default('')
    .transform((value) => value.trim()),
  IMAGE_CACHE_DIR: z.string().default('/cache/images'),
  PROFILE_IMAGE_DIR: z.string().default('/config/profiles'),
  SUBTITLE_DIR: z.string().optional(),
  VALENCE_BUCKET_ROOT: z.string().default('/buckets'),
  VALENCE_BUCKET_CACHE: z.string().default('/cache/buckets'),
  VALENCE_RCLONE: z.string().default('rclone'),
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
  IOS_APP_STORE_ID: z.string().regex(/^\d*$/u).default('6815748526'),
  SMTP_URL: z.string().default(''),
  SMTP_FROM: z.string().default(''),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Reads the process environment into a checked configuration, so a server that is misconfigured
 * fails at startup with a message naming the variable rather than at midnight with a type error.
 *
 * A production server still holding a placeholder secret is refused outright. Each one is published
 * for anybody to read, and everything sealed or signed with it — sessions, plugin credentials,
 * calendar feed addresses — would be as open as the source. Every placeholder Valence has shipped
 * says `change-me`: the development default, and the one `.env.example` carried, which the
 * landing's install route once copied into a deployment's `.env`. A random secret never does.
 *
 * `BETTER_AUTH_SECRET` and `COOKIE_SECURE` set to nothing count as unset, as a compose file that
 * names a variable `.env` leaves empty passes them: the secret falls back to the development one,
 * which production refuses by name, and the cookie choice made in setup stands.
 *
 * @param source - The process environment.
 * @returns The configuration, validated.
 */
const readEnv = (source: NodeJS.ProcessEnv): Env => {
  const env = EnvSchema.parse(source);

  if (
    env.NODE_ENV === 'production' &&
    env.BETTER_AUTH_SECRET.toLowerCase().includes(PLACEHOLDER_MARK)
  ) {
    throw new Error(say('server.env.aPlaceholderSecretInProduction'));
  }

  return env;
};

export type { Env };

export { readEnv };
