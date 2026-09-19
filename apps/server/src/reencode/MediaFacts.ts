import { z } from 'zod';
import { AudioStreamSchema, SubtitleStreamSchema } from '@ValenceContracts/schemas/MediaItem';

const MediaFactsSchema = z.object({
  sizeBytes: z.number().nonnegative(),
  modifiedAtMs: z.number().nonnegative(),
  container: z.string(),
  durationSeconds: z.number(),
  bitrateKbps: z.number().int().nullable(),
  videoCodec: z.string(),
  videoCodecTag: z.string().nullable(),
  videoRange: z.string(),
  videoRangeBase: z.string().nullable(),
  videoBitDepth: z.number().int().nullable(),
  canCopySegments: z.boolean().nullable(),
  videoLevel: z.number().int().nullable(),
  videoFrameRate: z.number().nullable(),
  videoIsInterlaced: z.boolean().nullable(),
  videoRefFrames: z.number().int().nullable(),
  videoPixelAspect: z.string().nullable(),
  videoRotationDegrees: z.number().int().nullable(),
  width: z.number().int(),
  height: z.number().int(),
  audioStreams: z.array(AudioStreamSchema),
  subtitleStreams: z.array(SubtitleStreamSchema),
  chapters: z
    .array(
      z.object({
        title: z.string().nullable(),
        startSeconds: z.number(),
        endSeconds: z.number(),
      }),
    )
    .nullable(),
});

type MediaFacts = z.infer<typeof MediaFactsSchema>;

export type { MediaFacts };

export { MediaFactsSchema };
