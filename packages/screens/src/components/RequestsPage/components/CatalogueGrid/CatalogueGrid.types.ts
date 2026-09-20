import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueGridProps = {
  browsing: CatalogueBrowse;
  onAsk: (asking: string) => void;
};

export type { CatalogueGridProps };
