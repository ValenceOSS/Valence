import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoverShelvesProps = {
  onAsk: (asking: string) => void;
  onBrowse: (browsing: CatalogueBrowse) => void;
  onBrowseStudio: (studioId: string) => void;
};

export type { DiscoverShelvesProps };
