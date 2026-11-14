import { z } from 'zod';
import { EpisodeGroupIdSchema } from './Anime';

const EpisodeOrdersSchema = z.object({
  orders: z.array(z.object({ id: z.string(), name: z.string(), type: z.number().int() })),
  chosen: z.string().nullable(),
});

const ChooseEpisodeOrderSchema = z.object({ order: EpisodeGroupIdSchema.nullable() });

const EpisodePinRequestSchema = z.object({
  pin: z
    .object({
      seasonNumber: z.number().int().min(0).max(9999),
      episodeNumber: z.number().int().min(1).max(99_999),
      episodeNumberEnd: z.number().int().min(1).max(99_999).nullable(),
    })
    .refine((pin) => pin.episodeNumberEnd === null || pin.episodeNumberEnd > pin.episodeNumber)
    .nullable(),
});

type EpisodeOrders = z.infer<typeof EpisodeOrdersSchema>;
type EpisodePinRequest = z.infer<typeof EpisodePinRequestSchema>;

export type { EpisodeOrders, EpisodePinRequest };

export { ChooseEpisodeOrderSchema, EpisodeOrdersSchema, EpisodePinRequestSchema };
