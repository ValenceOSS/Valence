import { z } from 'zod';
import { MusicAlbumSchema, MusicArtistSchema, MusicTrackSchema } from './Music';
import { PlaylistSummarySchema } from './Playlist';

const MusicSearchSchema = z.object({
  tracks: z.array(MusicTrackSchema),
  albums: z.array(MusicAlbumSchema),
  artists: z.array(MusicArtistSchema),
  playlists: z.array(PlaylistSummarySchema),
});

type MusicSearchResult = z.infer<typeof MusicSearchSchema>;

export type { MusicSearchResult };

export { MusicSearchSchema };
