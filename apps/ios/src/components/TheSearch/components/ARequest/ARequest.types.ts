import type {
  CatalogueBrowseKind,
  RequestProgress,
} from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type ARequestProps = {
  request: MediaRequest;
  progress: readonly RequestProgress[];
  myId: string | null;
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { ARequestProps };
