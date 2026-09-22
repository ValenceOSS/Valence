import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type FoundProps = {
  asked: string;
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { FoundProps };
