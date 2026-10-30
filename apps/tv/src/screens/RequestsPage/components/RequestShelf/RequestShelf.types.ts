import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestShelfProps = {
  name: string;
  requests: readonly MediaRequest[];
  goingOf: (request: MediaRequest) => RequestProgress | null;
  isFirst: boolean;
  onFocus: (request: MediaRequest) => void;
  onOpen: (request: MediaRequest) => void;
};

export type { RequestShelfProps };
