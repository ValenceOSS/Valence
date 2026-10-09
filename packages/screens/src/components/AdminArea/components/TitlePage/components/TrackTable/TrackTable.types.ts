import type { TitleFile } from '@ValenceContracts/schemas/AdminCatalogue';
import type { AlbumTrack } from '@ValenceContracts/schemas/MediaRequest';
import type { TitlePart } from '@ValenceClient/requests/TitlePart.types';

type TrackTableProps = {
  tracks: readonly AlbumTrack[];
  files: readonly TitleFile[];
  missing: TitlePart;
  onOpenFolder?: (path: string) => void;
};

export type { TrackTableProps };
