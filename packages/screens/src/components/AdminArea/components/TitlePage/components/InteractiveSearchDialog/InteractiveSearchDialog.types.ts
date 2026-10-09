import type { MediaRequest, SearchScope } from '@ValenceContracts/schemas/MediaRequest';

type InteractiveSearchDialogProps = {
  request: MediaRequest | null;
  scope?: SearchScope | null;
  onClose: () => void;
  onPicked: (request: MediaRequest) => void;
};

export type { InteractiveSearchDialogProps };
