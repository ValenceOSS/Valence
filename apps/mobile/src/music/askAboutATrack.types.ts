import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type InAPlaylist = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

type AskAboutATrack = {
  track: MusicTrack;
  player: MusicPlayer;
  isLiked: boolean;
  onLike: () => void;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  playlists: readonly PlaylistSummary[];
  onPlaylistsChanged: () => void;
  onPlaylist?: ((playlistId: string) => void) | undefined;
  inAPlaylist?: InAPlaylist | undefined;
};

export type { AskAboutATrack, InAPlaylist };
