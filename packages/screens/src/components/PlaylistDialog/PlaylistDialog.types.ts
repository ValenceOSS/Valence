import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

type PlaylistDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  playlist?: PlaylistSummary;
  onSaved?: (playlistId: string) => void;
};

export type { PlaylistDialogProps };
