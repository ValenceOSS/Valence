import type { PlaylistMissingSong } from '@ValenceContracts/schemas/Playlist';

type MissingSongDialogProps = {
  song: PlaylistMissingSong | null;
  onClose: () => void;
};

export type { MissingSongDialogProps };
