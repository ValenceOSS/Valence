import type { CatalogueBrowseKind, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type ACatalogueCardProps = {
  title: CatalogueTitle;
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
  wide?: number;
};

export type { ACatalogueCardProps };
