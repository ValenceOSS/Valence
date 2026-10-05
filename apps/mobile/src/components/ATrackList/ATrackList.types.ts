import type { QueueSource } from '@ValenceClient/music/playQueue';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type ATrackListMissingSong = {
  key: string;
  before: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  onChoose?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
};

type ATrackListProps = {
  tracks: readonly MusicTrack[];
  source: QueueSource;
  isOrdered?: boolean;
  isAnAlbum?: boolean;
  onAlbum: (albumId: string) => void;
  onArtist: (artistId: string) => void;
  onPlaylist?: (playlistId: string) => void;
  editing?: {
    onRemove: (at: number) => void;
    onMove: (from: number, to: number) => void;
  };
  missing?: readonly ATrackListMissingSong[];
};

export type { ATrackListMissingSong, ATrackListProps };
