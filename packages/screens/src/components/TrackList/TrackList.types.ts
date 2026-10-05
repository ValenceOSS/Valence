import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type TrackListMissingSong = {
  key: string;
  before: number;
  title: string;
  artist: string;
  album: string | null;
  coverUrl: string | null;
  onChoose?: (() => void) | undefined;
  onRemove?: (() => void) | undefined;
};

type TrackListProps = {
  label: string;
  tracks: readonly MusicTrack[];
  onPlay: (index: number) => void;
  showsAlbum?: boolean;
  showsArtwork?: boolean;
  numbering?: 'track' | 'position';
  onRemove?: (index: number) => void;
  onMove?: (index: number, direction: 'up' | 'down') => void;
  onReorder?: (from: number, to: number) => void;
  missing?: readonly TrackListMissingSong[];
};

export type { TrackListMissingSong, TrackListProps };
