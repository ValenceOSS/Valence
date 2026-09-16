import { z } from 'zod';

const RESOURCE_SAMPLE_RANGES = ['24h', '3d', '7d'] as const;

const RESOURCE_SAMPLE_KEPT_FOR_DAYS = 7;

const ResourceSampleRangeSchema = z.enum(RESOURCE_SAMPLE_RANGES);

const ResourceSampleRecordSchema = z.object({
  id: z.string(),
  atMs: z.number().int().nonnegative(),
  systemCpuPercent: z.number(),
  loadAverage: z.number(),
  systemMemoryUsedBytes: z.number(),
  systemMemoryTotalBytes: z.number(),
  cpuCount: z.number().int().nonnegative(),
});

const ResourceSampleHistorySchema = z.object({
  records: z.array(ResourceSampleRecordSchema),
});

const ResourceSampleQuerySchema = z.object({
  range: ResourceSampleRangeSchema.default('24h'),
});

type ResourceSampleRange = z.infer<typeof ResourceSampleRangeSchema>;
type ResourceSampleRecord = z.infer<typeof ResourceSampleRecordSchema>;
type ResourceSampleHistory = z.infer<typeof ResourceSampleHistorySchema>;
type ResourceSampleQuery = z.infer<typeof ResourceSampleQuerySchema>;

const RESOURCE_SAMPLE_RANGE_MS: Readonly<Record<ResourceSampleRange, number>> = {
  '24h': 86_400_000,
  '3d': 3 * 86_400_000,
  '7d': 7 * 86_400_000,
};

/**
 * How far back a range reaches from now, so a reader asks the store for a cutoff rather than a word.
 *
 * @param range - The range asked for.
 * @param nowMs - The moment the range is measured from.
 * @returns The earliest moment the range includes.
 */
const sinceMsForRange = (range: ResourceSampleRange, nowMs: number): number =>
  nowMs - RESOURCE_SAMPLE_RANGE_MS[range];

export type {
  ResourceSampleRange,
  ResourceSampleRecord,
  ResourceSampleHistory,
  ResourceSampleQuery,
};

export {
  RESOURCE_SAMPLE_RANGES,
  RESOURCE_SAMPLE_KEPT_FOR_DAYS,
  ResourceSampleRangeSchema,
  ResourceSampleRecordSchema,
  ResourceSampleHistorySchema,
  ResourceSampleQuerySchema,
  sinceMsForRange,
};
