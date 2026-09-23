import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueShelfProps = {
  title: string;
  titles: readonly CatalogueTitle[];
  onOpen: (title: CatalogueTitle) => void;
};

export type { CatalogueShelfProps };
