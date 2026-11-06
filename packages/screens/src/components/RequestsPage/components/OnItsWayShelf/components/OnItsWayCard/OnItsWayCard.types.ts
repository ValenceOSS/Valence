import type { ReactNode } from 'react';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type OnItsWayCardProps = {
  request: MediaRequest;
  going: RequestProgress | null;
  overlayOf: (request: MediaRequest) => ReactNode;
  onAsk: (asking: string) => void;
};

export type { OnItsWayCardProps };
