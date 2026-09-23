import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type APlaylistDetailsProps = {
  isOpen: boolean;
  editing: PlaylistSummary | null;
  onClose: () => void;
  onDone: (playlistId: string) => void;
};

export type { APlaylistDetailsProps };
