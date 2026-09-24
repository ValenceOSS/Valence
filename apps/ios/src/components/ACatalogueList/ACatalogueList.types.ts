import type {
  CatalogueBrowse,
  CatalogueBrowseKind,
} from '@ValenceContracts/schemas/CatalogueTitle';

type ACatalogueListProps = {
  browsing: CatalogueBrowse;
  title: string;
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
  onBack: () => void;
};

export type { ACatalogueListProps };
