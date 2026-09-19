import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type AskForMediaDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAsked: (request: MediaRequest) => void;
};

export type { AskForMediaDialogProps };
