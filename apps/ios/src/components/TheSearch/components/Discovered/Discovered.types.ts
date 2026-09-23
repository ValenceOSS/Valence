import type { CatalogueBrowseKind } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoveredProps = {
  onAsk: (kind: CatalogueBrowseKind, id: string) => void;
};

export type { DiscoveredProps };
