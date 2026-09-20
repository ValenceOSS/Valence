import type { CatalogueBrowse, CatalogueShelf } from '@ValenceContracts/schemas/CatalogueTitle';

type TitleShelfProps = {
  shelf: CatalogueShelf;
  onAsk: (asking: string) => void;
  onBrowse: (browsing: CatalogueBrowse) => void;
};

export type { TitleShelfProps };
