import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type TrackListProps = {
  label: string;
  tracks: readonly MusicTrack[];
  onPlay: (index: number) => void;
  showsAlbum?: boolean;
  showsArtwork?: boolean;
  numbering?: 'track' | 'position';
  onRemove?: (index: number) => void;
  onMove?: (index: number, direction: 'up' | 'down') => void;
};

export type { TrackListProps };
