import { z } from 'zod';

const SEGMENT_KINDS = ['intro', 'recap', 'credits', 'preview'] as const;

const SegmentKindSchema = z.enum(SEGMENT_KINDS);

const SEGMENT_SOURCES = ['fingerprint', 'manual', 'imported'] as const;

const SegmentSourceSchema = z.enum(SEGMENT_SOURCES);

const MediaSegmentSchema = z.object({
  kind: SegmentKindSchema,
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  source: SegmentSourceSchema,
});

const SetSegmentsSchema = z.object({
  segments: z
    .array(
      z
        .object({
          kind: SegmentKindSchema,
          startSeconds: z.number().nonnegative(),
          endSeconds: z.number().positive(),
        })
        .refine((segment) => segment.endSeconds > segment.startSeconds),
    )
    .max(16),
});

type MediaSegment = z.infer<typeof MediaSegmentSchema>;
type SegmentKind = z.infer<typeof SegmentKindSchema>;
export type { MediaSegment, SegmentKind };

export {
  SetSegmentsSchema,
  MediaSegmentSchema,
  SegmentKindSchema,
  SegmentSourceSchema,
  SEGMENT_KINDS,
  SEGMENT_SOURCES,
};
