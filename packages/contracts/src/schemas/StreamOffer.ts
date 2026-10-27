import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import {
  AudioCodecSchema,
  HdrFormatSchema,
  ReleaseSourceSchema,
  ResolutionSchema,
  VideoCodecSchema,
} from './ParsedRelease';

const StreamOfferSchema = z.object({
  id: z.string().min(1).max(200),
  sourceName: z.string(),
  name: z.string(),
  fileName: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  isReady: z.boolean(),
  seeders: z.number().int().nonnegative().nullable(),
  resolution: ResolutionSchema.nullable(),
  source: ReleaseSourceSchema.nullable(),
  codec: VideoCodecSchema.nullable(),
  hdr: z.array(HdrFormatSchema),
  audio: z.array(AudioCodecSchema),
  languages: z.array(z.string()),
  group: z.string().nullable(),
});

const StreamOffersSchema = z.object({
  offers: z.array(StreamOfferSchema),
  problems: z.array(SaidSchema),
});

const StreamPlaySchema = z.object({ streamId: z.string().min(1).max(200) });

const StreamPlayedSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ready'), mediaId: z.string() }),
  z.object({ kind: z.literal('preparing'), progress: z.number().min(0).max(1).nullable() }),
]);

type StreamOffer = z.infer<typeof StreamOfferSchema>;

type StreamOffers = z.infer<typeof StreamOffersSchema>;

type StreamPlay = z.infer<typeof StreamPlaySchema>;

type StreamPlayed = z.infer<typeof StreamPlayedSchema>;

export type { StreamOffer, StreamOffers, StreamPlay, StreamPlayed };

export { StreamOfferSchema, StreamOffersSchema, StreamPlaySchema, StreamPlayedSchema };
