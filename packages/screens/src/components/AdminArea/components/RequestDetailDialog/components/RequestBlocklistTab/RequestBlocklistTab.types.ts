import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestBlocklistTabProps = {
  request: MediaRequest;
  onLifted: () => void;
};

export type { RequestBlocklistTabProps };
