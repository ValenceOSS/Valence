import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';
import type { CatalogueTrack } from '@ValenceContracts/schemas/CatalogueTitle';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';

type TrackTableProps = {
  tracks: readonly CatalogueTrack[];
  files: readonly TitleFile[];
  missing: TitlePart;
  onOpenFolder?: (path: string) => void;
};

export type { TrackTableProps };
