import { z } from 'zod';

const ProbedVideoSchema = z.object({
  codec: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const ProbedAudioSchema = z.object({
  codec: z.string(),
  channels: z.number().int().nonnegative(),
  profile: z.string().nullish(),
});

const ProbedMediaSchema = z.object({
  video: ProbedVideoSchema.nullish(),
  audioStreams: z.array(ProbedAudioSchema).default([]),
});

type ProbedMedia = z.infer<typeof ProbedMediaSchema>;

export type { ProbedMedia };

export { ProbedMediaSchema };
