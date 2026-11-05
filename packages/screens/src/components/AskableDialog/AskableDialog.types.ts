import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type AskableDialogProps = {
  asking: string | null;
  onClose: () => void;
  onOpen: (kind: MediaRequestKind, mediaId: string) => void;
  onPlay: (mediaId: string) => void;
  onOpenPerson?: (personId: number, role: string) => void;
  onBack?: () => void;
  backLabel?: string;
};

export type { AskableDialogProps };
