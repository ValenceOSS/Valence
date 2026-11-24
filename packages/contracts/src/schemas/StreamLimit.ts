import { z } from 'zod';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';

const StreamLimitSchema = z.object({
  maxBitrateKbps: z.number().int().min(250).max(500_000).nullable().default(null),
  maxStreams: z.number().int().min(1).max(50).nullable().default(null),
  maxQuality: QualityStepIdSchema.nullable().default(null),
  limitsDownloads: z.boolean().default(false),
});

const StreamLimitsSchema = z.object({
  accounts: z.record(z.string(), StreamLimitSchema).default({}),
  roles: z.record(z.string(), StreamLimitSchema).default({}),
});

const NO_STREAM_LIMIT: StreamLimit = {
  maxBitrateKbps: null,
  maxStreams: null,
  maxQuality: null,
  limitsDownloads: false,
};

type StreamLimit = z.infer<typeof StreamLimitSchema>;

type StreamLimits = z.infer<typeof StreamLimitsSchema>;

export type { StreamLimit, StreamLimits };

export { NO_STREAM_LIMIT, StreamLimitSchema, StreamLimitsSchema };
