import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type ApproveRequestDialogProps = {
  request: MediaRequest | null;
  onClose: () => void;
  onApproved: (request: MediaRequest) => void;
};

export type { ApproveRequestDialogProps };
