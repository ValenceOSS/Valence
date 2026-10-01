import { z } from 'zod';
import { LidarrArtistSchema } from '@ValenceRequests/arrApps/schemas/LidarrArtistSchema';

const LidarrAlbumSchema = z.object({
  id: z.number().int().default(0),
  foreignAlbumId: z.string(),
  title: z.string(),
  artistId: z.number().int().default(0),
  monitored: z.boolean().default(false),
  statistics: z
    .object({
      trackFileCount: z.number().int().nonnegative().default(0),
      trackCount: z.number().int().nonnegative().default(0),
      totalTrackCount: z.number().int().nonnegative().default(0),
    })
    .nullish(),
  artist: LidarrArtistSchema.nullish(),
});

type LidarrAlbum = z.infer<typeof LidarrAlbumSchema>;

export type { LidarrAlbum };

export { LidarrAlbumSchema };
