import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

type CatalogueGridProps = {
  entries: readonly CatalogueEntry[];
  size: MediaGridSize;
  isSquare: boolean;
  isChoosing: boolean;
  chosen: ReadonlySet<string>;
  onChoose: (key: string, isChosen: boolean) => void;
  onOpen: (entry: CatalogueEntry) => void;
};

export type { CatalogueGridProps };
