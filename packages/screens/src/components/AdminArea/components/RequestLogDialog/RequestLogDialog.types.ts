import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestLogDialogProps = {
  request: MediaRequest | null;
  onClose: () => void;
};

export type { RequestLogDialogProps };
