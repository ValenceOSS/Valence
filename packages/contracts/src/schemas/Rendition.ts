import { z } from 'zod';
import {
  AudioStreamSchema,
  ContainerSchema,
  SubtitleStreamSchema,
  VideoCodecSchema,
  VideoRangeSchema,
} from './MediaItem';
import { QualityStepIdSchema } from './QualityStep';

const RENDITION_KINDS = ['pinned'] as const;

const RenditionKindSchema = z.enum(RENDITION_KINDS);

const RenditionSchema = z.object({
  id: z.string().uuid(),
  mediaItemId: z.string().uuid(),
  kind: RenditionKindSchema,
  label: z.string().min(1),
  quality: QualityStepIdSchema.nullable(),
  sizeBytes: z.number().nonnegative(),
  container: ContainerSchema,
  durationSeconds: z.number().positive(),
  bitrateKbps: z.number().int().positive(),
  videoCodec: VideoCodecSchema,
  videoRange: VideoRangeSchema,
  videoRangeBase: VideoRangeSchema.nullish(),
  videoBitDepth: z.number().int().positive().default(8),
  canCopySegments: z.boolean().default(true),
  videoLevel: z.number().int().positive().nullish(),
  videoFrameRate: z.number().positive().nullish(),
  videoIsInterlaced: z.boolean().default(false),
  videoRefFrames: z.number().int().positive().nullish(),
  videoPixelAspect: z.string().nullish(),
  videoRotationDegrees: z.number().int().nullish(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  audioStreams: z.array(AudioStreamSchema).min(1),
  subtitleStreams: z.array(SubtitleStreamSchema),
  createdAt: z.string().datetime(),
});

const RenditionListSchema = z.object({ renditions: z.array(RenditionSchema) });

type RenditionKind = z.infer<typeof RenditionKindSchema>;
type Rendition = z.infer<typeof RenditionSchema>;

export type { Rendition, RenditionKind };

export { RENDITION_KINDS, RenditionKindSchema, RenditionListSchema, RenditionSchema };
