import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type YourRequestsProps = {
  onOpen: (request: MediaRequest) => void;
  onFocus: () => void;
  onLight: (path: string | null) => void;
};

export type { YourRequestsProps };
