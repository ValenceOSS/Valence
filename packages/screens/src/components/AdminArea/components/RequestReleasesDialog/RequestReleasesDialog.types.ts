import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestReleasesDialogProps = {
  request: MediaRequest | null;
  onClose: () => void;
  onPicked: (request: MediaRequest) => void;
};

export type { RequestReleasesDialogProps };
