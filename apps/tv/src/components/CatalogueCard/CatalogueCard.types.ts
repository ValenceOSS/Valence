import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

type CatalogueCardProps = {
  title: CatalogueTitle;
  onPress: (title: CatalogueTitle) => void;
  width?: number;
};

export type { CatalogueCardProps };
