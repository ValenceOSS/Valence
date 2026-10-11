import { z } from 'zod';
import { ContainerSchema, VideoCodecSchema, VideoRangeSchema } from './MediaItem';
import { QualityStepIdSchema } from './QualityStep';

const KeptCopySchema = z.object({
  quality: QualityStepIdSchema,
  url: z.string().min(1),
  container: ContainerSchema,
  videoCodec: VideoCodecSchema,
  videoRange: VideoRangeSchema,
  videoBitDepth: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bitrateKbps: z.number().int().positive(),
});

type KeptCopy = z.infer<typeof KeptCopySchema>;

export type { KeptCopy };

export { KeptCopySchema };
