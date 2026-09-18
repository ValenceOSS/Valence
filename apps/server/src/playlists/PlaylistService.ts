import type {
  CreatePlaylist,
  PlaylistDetail,
  PlaylistSummary,
  UpdatePlaylist,
} from '@ValenceContracts/schemas/Playlist';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

type PlaylistService = {
  list: (viewer: Viewer) => Promise<PlaylistSummary[]>;
  read: (viewer: Viewer, playlistId: string) => Promise<PlaylistDetail | null>;
  create: (viewer: Viewer, input: CreatePlaylist) => Promise<PlaylistSummary | null>;
  update: (
    viewer: Viewer,
    playlistId: string,
    patch: UpdatePlaylist,
  ) => Promise<PlaylistSummary | null>;
  remove: (viewer: Viewer, playlistId: string) => Promise<boolean>;
  add: (
    viewer: Viewer,
    playlistId: string,
    mediaItemIds: readonly string[],
  ) => Promise<number | null>;
  move: (
    viewer: Viewer,
    playlistId: string,
    entryId: string,
    afterEntryId: string | null,
  ) => Promise<boolean>;
  drop: (viewer: Viewer, playlistId: string, entryId: string) => Promise<boolean>;
};

export type { PlaylistService };
