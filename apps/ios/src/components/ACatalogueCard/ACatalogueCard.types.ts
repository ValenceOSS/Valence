import type { CatalogueBrowseKind, CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type ACatalogueCardProps = {
  title: CatalogueTitle;
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { ACatalogueCardProps };
