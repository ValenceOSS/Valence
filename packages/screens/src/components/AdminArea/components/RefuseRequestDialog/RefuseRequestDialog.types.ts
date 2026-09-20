import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RefuseRequestDialogProps = {
  request: MediaRequest | null;
  onClose: () => void;
  onRefused: (request: MediaRequest) => void;
};

export type { RefuseRequestDialogProps };
