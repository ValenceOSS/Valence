import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type DiscoverHeroProps = {
  titles: readonly CatalogueTitle[];
  onAsk: (asking: string) => void;
  rotateAfterMilliseconds?: number;
};

export type { DiscoverHeroProps };
