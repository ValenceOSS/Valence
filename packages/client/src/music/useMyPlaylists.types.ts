import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type MyPlaylists = {
  mine: PlaylistSummary[];
  changed: () => void;
};

export type { MyPlaylists };
