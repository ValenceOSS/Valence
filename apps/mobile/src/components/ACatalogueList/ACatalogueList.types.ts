import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueBrowse, CatalogueSearch } from '@ValenceContracts/schemas/CatalogueTitle';

type ACatalogueListProps = {
  browsing: CatalogueBrowse | CatalogueSearch;
  title: string;
  onAsk: (kind: MediaRequestKind, id: string) => void;
  onBack: () => void;
};

export type { ACatalogueListProps };
