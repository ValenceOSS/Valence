import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type RequestsPageProps = {
  onOpen: (request: MediaRequest) => void;
  onLight: (path: string | null) => void;
};

export type { RequestsPageProps };
