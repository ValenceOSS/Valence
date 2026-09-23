import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type AnAskableProps = {
  kind: CatalogueBrowseKind;
  id: string;
  onOpen: (kind: CatalogueBrowseKind, mediaId: string) => void;
  onBack: () => void;
};

export type { AnAskableProps };
