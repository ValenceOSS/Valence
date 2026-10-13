import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type ADiscoverHeroProps = {
  titles: readonly CatalogueTitle[];
  onAsk: (kind: MediaRequestKind, id: string) => void;
};

export type { ADiscoverHeroProps };
