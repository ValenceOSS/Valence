import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest, MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type ARequestProps = {
  request: MediaRequest;
  progress: readonly RequestProgress[];
  myId: string | null;
  onAsk: (kind: MediaRequestKind, id: string) => void;
};

export type { ARequestProps };
