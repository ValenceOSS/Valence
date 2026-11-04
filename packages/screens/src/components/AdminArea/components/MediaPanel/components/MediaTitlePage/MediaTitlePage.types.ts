import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { ActionMenuItem } from '@ValenceUI/ActionMenu.types';
import type { CatalogueAddress } from '@ValenceScreens/components/AdminArea/components/CataloguePanel/CatalogueAddress.types';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';

type MediaTitlePageProps = {
  title: MediaTitle;
  library: Library | null;
  actionsFor: (title: MediaTitle) => ActionMenuItem[][];
  place: { shown: string; folder: string } | null;
  paths: Readonly<Record<string, string>>;
  onOpenFolder?: (path: string) => void;
  onOpenInCatalogue?: (address: CatalogueAddress) => void;
  onBack: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  titlePlace?: TitlePlace;
  onTitlePlace?: (place: TitlePlace) => void;
};

export type { MediaTitlePageProps };
