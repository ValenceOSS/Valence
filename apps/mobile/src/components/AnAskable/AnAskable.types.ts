import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type AnAskableProps = {
  kind: MediaRequestKind;
  id: string;
  isMore?: boolean;
  onOpen: (kind: CatalogueBrowseKind, mediaId: string) => void;
  onAskAbout?: (kind: MediaRequestKind, id: string) => void;
  onPlay?: (mediaId: string) => void;
  onBack: () => void;
};

export type { AnAskableProps };
