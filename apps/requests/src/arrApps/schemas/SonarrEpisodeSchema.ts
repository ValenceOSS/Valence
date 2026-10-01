import { z } from 'zod';

const SonarrEpisodeSchema = z.object({
  id: z.number().int(),
  seasonNumber: z.number().int(),
  episodeNumber: z.number().int(),
  hasFile: z.boolean().default(false),
  monitored: z.boolean().default(false),
  episodeFileId: z.number().int().nullish(),
  airDateUtc: z.string().nullish(),
});

type SonarrEpisode = z.infer<typeof SonarrEpisodeSchema>;

export type { SonarrEpisode };

export { SonarrEpisodeSchema };
