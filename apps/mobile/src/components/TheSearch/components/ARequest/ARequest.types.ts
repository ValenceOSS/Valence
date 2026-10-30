import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest, MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';

type ARequestProps = {
  request: MediaRequest;
  progress: readonly RequestProgress[];
  me: Me | null;
  faces: readonly ViewerProfile[];
  onAsk: (kind: MediaRequestKind, id: string) => void;
};

export type { ARequestProps };
