import type { CatalogueTab } from '@ValenceContracts/schemas/AdminCatalogue';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type CataloguePanelProps = {
  tab: CatalogueTab;
  title: string | null;
  onTab: (tab: CatalogueTab) => void;
  onOpen: (key: string | null) => void;
  onOpenFolder?: (path: string) => void;
  onChooseArtwork?: (subject: ArtworkSubject) => void;
};

export type { CataloguePanelProps };
