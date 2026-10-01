import { z } from 'zod';

const LidarrArtistSchema = z.object({
  id: z.number().int().default(0),
  foreignArtistId: z.string(),
  artistName: z.string(),
  path: z.string().nullish(),
  monitored: z.boolean().default(false),
});

type LidarrArtist = z.infer<typeof LidarrArtistSchema>;

export type { LidarrArtist };

export { LidarrArtistSchema };
