import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type YourRequestsProps = {
  onOpen: (request: MediaRequest) => void;
  onFocus: () => void;
};

export type { YourRequestsProps };
