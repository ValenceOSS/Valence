import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type InteractiveSearchDialogProps = {
  request: MediaRequest | null;
  onClose: () => void;
  onPicked: (request: MediaRequest) => void;
};

export type { InteractiveSearchDialogProps };
