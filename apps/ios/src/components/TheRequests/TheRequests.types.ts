import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type TheRequestsProps = {
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { TheRequestsProps };
