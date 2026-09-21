import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueBrowserProps = {
  browsing: CatalogueBrowse;
  onAsk: (asking: string) => void;
};

export type { CatalogueBrowserProps };
