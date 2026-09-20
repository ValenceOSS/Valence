import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestDetailTab = 'going' | 'releases' | 'history' | 'blocked';

type RequestDetailDialogProps = {
  request: MediaRequest | null;
  openOn?: RequestDetailTab;
  onClose: () => void;
  onChanged: () => void;
};

export type { RequestDetailDialogProps, RequestDetailTab };
