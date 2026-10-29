import { z } from 'zod';
import { CLIENT_KINDS } from './ClientKind';

const TELEMETRY_COUNT_BUCKETS = ['0', '1-9', '10-99', '100-999', '1000-9999', '10000+'] as const;

const TELEMETRY_MEMORY_BUCKETS = ['<4', '4-8', '8-16', '16-32', '32-64', '64-128', '128+'] as const;

const TELEMETRY_INSTALL_METHODS = ['docker', 'native', 'desktop', 'other'] as const;

const TELEMETRY_PLATFORMS = ['linux', 'darwin', 'win32', 'freebsd', 'other'] as const;

const TELEMETRY_ARCHITECTURES = ['x64', 'arm64', 'arm', 'other'] as const;

const TELEMETRY_GPU_VENDORS = ['nvidia', 'amd', 'intel', 'apple', 'qualcomm', 'other'] as const;

const TELEMETRY_DATABASES = ['postgres', 'mysql', 'mariadb'] as const;

const TelemetryCountBucketSchema = z.enum(TELEMETRY_COUNT_BUCKETS);

const TelemetryReportSchema = z.object({
  schemaVersion: z.literal(1),
  installId: z.string().uuid(),
  version: z.string().min(1).max(40),
  installMethod: z.enum(TELEMETRY_INSTALL_METHODS),
  os: z.object({
    platform: z.enum(TELEMETRY_PLATFORMS),
    release: z.string().max(80),
    arch: z.enum(TELEMETRY_ARCHITECTURES),
  }),
  cpu: z.object({
    model: z.string().max(120),
    cores: z.number().int().min(1).max(1024),
  }),
  memoryGb: z.enum(TELEMETRY_MEMORY_BUCKETS),
  gpus: z
    .array(z.object({ vendor: z.enum(TELEMETRY_GPU_VENDORS), model: z.string().max(120) }))
    .max(16),
  accels: z.array(z.string().min(1).max(32)).max(16),
  database: z.enum(TELEMETRY_DATABASES),
  library: z.object({
    films: TelemetryCountBucketSchema,
    episodes: TelemetryCountBucketSchema,
    tracks: TelemetryCountBucketSchema,
    books: TelemetryCountBucketSchema,
  }),
  clients: z.partialRecord(z.enum(CLIENT_KINDS), TelemetryCountBucketSchema),
});

type TelemetryCountBucket = z.infer<typeof TelemetryCountBucketSchema>;

type TelemetryReport = z.infer<typeof TelemetryReportSchema>;

export type { TelemetryCountBucket, TelemetryReport };

export {
  TELEMETRY_ARCHITECTURES,
  TELEMETRY_COUNT_BUCKETS,
  TELEMETRY_DATABASES,
  TELEMETRY_GPU_VENDORS,
  TELEMETRY_INSTALL_METHODS,
  TELEMETRY_MEMORY_BUCKETS,
  TELEMETRY_PLATFORMS,
  TelemetryCountBucketSchema,
  TelemetryReportSchema,
};
