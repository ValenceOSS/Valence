import type { CatalogueStudio } from '@ValenceContracts/schemas/CatalogueTitle';

type StudiosRailProps = {
  studios: CatalogueStudio[];
  onOpen: (studioId: string) => void;
};

export type { StudiosRailProps };
