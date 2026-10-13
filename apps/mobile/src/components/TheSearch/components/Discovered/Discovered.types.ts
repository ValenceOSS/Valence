import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueBrowse } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoveredProps = {
  onAsk: (kind: MediaRequestKind, id: string) => void;
  onSeeAll?: (browsing: CatalogueBrowse, title: string) => void;
};

export type { DiscoveredProps };
