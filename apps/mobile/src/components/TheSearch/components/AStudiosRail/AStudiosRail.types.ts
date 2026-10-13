import type { CatalogueStudio } from '@ValenceContracts/schemas/CatalogueTitle';

type AStudiosRailProps = {
  studios: readonly CatalogueStudio[];
  onOpen: (studio: CatalogueStudio) => void;
};

export type { AStudiosRailProps };
