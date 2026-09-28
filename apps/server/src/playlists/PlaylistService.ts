import type {
  CreatePlaylist,
  PlaylistDetail,
  PlaylistSummary,
  UpdatePlaylist,
} from '@ValenceContracts/schemas/Playlist';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { PictureFault } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

type PlaylistArtwork = {
  body: Uint8Array;
  contentType: string;
};

type PlaylistService = {
  list: (viewer: Viewer) => Promise<PlaylistSummary[]>;
  read: (viewer: Viewer, playlistId: string) => Promise<PlaylistDetail | null>;
  create: (viewer: Viewer, input: CreatePlaylist) => Promise<PlaylistSummary | null>;
  update: (
    viewer: Viewer,
    playlistId: string,
    patch: UpdatePlaylist,
  ) => Promise<PlaylistSummary | null>;
  remove: (viewer: Viewer, playlistId: string, mayClearAbandoned: boolean) => Promise<boolean>;
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
  readArtwork: (viewer: Viewer, playlistId: string) => Promise<PlaylistArtwork | null>;
  saveArtwork: (
    viewer: Viewer,
    playlistId: string,
    artwork: PlaylistArtwork,
  ) => Promise<PictureFault | null>;
  dropArtwork: (viewer: Viewer, playlistId: string) => Promise<boolean>;
};

export type { PlaylistArtwork, PlaylistService };
