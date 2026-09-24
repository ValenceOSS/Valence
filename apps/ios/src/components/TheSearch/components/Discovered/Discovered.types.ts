import type {
  CatalogueBrowse,
  CatalogueBrowseKind,
} from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoveredProps = {
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
  onSeeAll?: (browsing: CatalogueBrowse, title: string) => void;
};

export type { DiscoveredProps };
