import type {
  CatalogueBrowse,
  CatalogueFilters,
  CatalogueSearch,
} from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueGridProps = {
  browsing: CatalogueBrowse | CatalogueSearch;
  filters?: CatalogueFilters;
  onAsk: (asking: string) => void;
};

export type { CatalogueGridProps };
