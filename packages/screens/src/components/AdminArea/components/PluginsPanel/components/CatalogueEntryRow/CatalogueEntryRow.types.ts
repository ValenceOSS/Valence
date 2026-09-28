import type { CatalogueListing } from '@ValenceContracts/schemas/Plugin';

type CatalogueEntryRowProps = {
  entry: CatalogueListing['plugins'][number];
  isBusy: boolean;
  onInstall: () => void;
};

export type { CatalogueEntryRowProps };
