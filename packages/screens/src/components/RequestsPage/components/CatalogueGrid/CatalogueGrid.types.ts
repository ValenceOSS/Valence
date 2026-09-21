import type { CatalogueBrowse, CatalogueFilters } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueGridProps = {
  browsing: CatalogueBrowse;
  filters?: CatalogueFilters;
  onAsk: (asking: string) => void;
};

export type { CatalogueGridProps };
