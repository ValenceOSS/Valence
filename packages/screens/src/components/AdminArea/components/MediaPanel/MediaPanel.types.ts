import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { Freshness } from '@ValenceClient/query/Freshness';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { CatalogueAddress } from '@ValenceScreens/components/AdminArea/components/CataloguePanel/CatalogueAddress.types';
import type { TitleShow, TitleSort } from '@ValenceContracts/schemas/TitleList';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type MediaView = 'titles' | 'folders';

type ListPlace = {
  library: string | null;
  search: string;
  show: TitleShow;
  sort: TitleSort;
  isDescending: boolean;
  filters: readonly string[];
};

type MediaReading = {
  libraries: boolean;
  files: boolean;
  albums: boolean;
  books: boolean;
};

type MediaPanelProps = {
  isUnreachable?: boolean;
  freshness?: Freshness;
  stillReading?: MediaReading;
  libraries: readonly Library[];
  albums?: readonly MusicAlbum[];
  books?: readonly Book[];
  onCorrect: (media: MediaSummary) => void;
  onChooseArtwork?: (subject: ArtworkSubject) => void;
  onCorrectAlbum?: (album: MusicAlbum) => void;
  onCorrectBook?: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onRebuildArtefacts: (media: MediaSummary) => Promise<boolean>;
  openedTitle?: string | null;
  onOpenTitle?: (id: string | null, place?: TitlePlace) => void;
  titlePlace?: TitlePlace;
  onTitlePlace?: (place: TitlePlace) => void;
  onReencode?: (media: readonly MediaSummary[]) => void;
  onShowCopies?: (media: MediaSummary, name: string) => void;
  onDelete?: (media: MediaSummary, isWholeSeries: boolean) => Promise<boolean>;
  paths?: Readonly<Record<string, string>>;
  onOpenFolder?: (path: string) => void;
  onMoved?: (libraryId: string, jobId: string | null) => void;
  onOpenInCatalogue?: (address: CatalogueAddress) => void;
  view?: MediaView;
  listPlace?: ListPlace;
  onListPlace?: (place: ListPlace) => void;
  onView?: (view: MediaView) => void;
  folder?: string | null;
  onFolder?: (path: string | null) => void;
  mayManageFiles?: boolean;
  onFilesChanged?: () => void;
  onScan?: (libraryId: string) => void;
};

export type { ListPlace, MediaPanelProps, MediaReading, MediaView };
