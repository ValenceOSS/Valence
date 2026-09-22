import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type AskedProps = {
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { AskedProps };
