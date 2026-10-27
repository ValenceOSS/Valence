import { z } from 'zod';
import { MusicAlbumSchema, MusicArtistSchema, MusicTrackSchema } from './Music';
import { PlaylistSummaryReadSchema, PlaylistSummarySchema } from './Playlist';

const MusicSearchSchema = z.object({
  tracks: z.array(MusicTrackSchema),
  albums: z.array(MusicAlbumSchema),
  artists: z.array(MusicArtistSchema),
  playlists: z.array(PlaylistSummarySchema),
});

const MusicSearchReadSchema = MusicSearchSchema.extend({
  playlists: z.array(PlaylistSummaryReadSchema),
});

type MusicSearchResult = z.infer<typeof MusicSearchSchema>;

export type { MusicSearchResult };

export { MusicSearchReadSchema, MusicSearchSchema };
