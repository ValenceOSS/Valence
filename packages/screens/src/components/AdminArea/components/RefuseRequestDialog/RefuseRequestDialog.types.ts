import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RefuseRequestDialogProps = {
  howMany?: number;
  onRefuseMany?: (reason: string) => void;
  request: MediaRequest | null;
  onClose: () => void;
  onRefused: (request: MediaRequest) => void;
};

export type { RefuseRequestDialogProps };
