import { z } from 'zod';
import { MusicTrackSchema } from './Music';

const MIX_KINDS = ['daily', 'onRepeat', 'rediscover', 'genre', 'decade'] as const;

const MixKindSchema = z.enum(MIX_KINDS);

const MusicMixSummarySchema = z.object({
  id: z.string().min(1),
  kind: MixKindSchema,
  title: z.string(),
  detail: z.string(),
  trackCount: z.number().int().nonnegative(),
  coverAlbumIds: z.array(z.string()),
});

const MusicMixListSchema = z.object({ mixes: z.array(MusicMixSummarySchema) });

const MusicMixSchema = MusicMixSummarySchema.extend({ tracks: z.array(MusicTrackSchema) });

type MixKind = z.infer<typeof MixKindSchema>;

type MusicMixSummary = z.infer<typeof MusicMixSummarySchema>;

type MusicMix = z.infer<typeof MusicMixSchema>;

export type { MixKind, MusicMix, MusicMixSummary };

export { MIX_KINDS, MixKindSchema, MusicMixListSchema, MusicMixSchema, MusicMixSummarySchema };
