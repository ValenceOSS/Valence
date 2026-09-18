import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type PlaylistShelfProps = {
  heading: string;
  playlists: readonly PlaylistSummary[];
};

export type { PlaylistShelfProps };
