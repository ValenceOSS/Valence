import type { Me } from '@ValenceContracts/functions/isMyAsk';
import type { RequestProgress } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest, MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type ARequestProps = {
  request: MediaRequest;
  progress: readonly RequestProgress[];
  me: Me | null;
  onAsk: (kind: MediaRequestKind, id: string) => void;
};

export type { ARequestProps };
