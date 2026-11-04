import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { Freshness } from '@ValenceClient/query/Freshness';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { CatalogueAddress } from '@ValenceScreens/components/AdminArea/components/CataloguePanel/CatalogueAddress.types';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

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
  media: readonly MediaSummary[];
  albums?: readonly MusicAlbum[];
  books?: readonly Book[];
  onCorrect: (media: MediaSummary) => void;
  onChooseArtwork?: (subject: ArtworkSubject) => void;
  onCorrectAlbum?: (album: MusicAlbum) => void;
  onCorrectBook?: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onRebuildArtefacts: (media: MediaSummary) => Promise<boolean>;
  openedTitle?: string | null;
  onOpenTitle?: (id: string | null) => void;
  titlePlace?: TitlePlace;
  onTitlePlace?: (place: TitlePlace) => void;
  onReencode?: (media: readonly MediaSummary[]) => void;
  onShowCopies?: (media: MediaSummary, name: string) => void;
  onDelete?: (media: MediaSummary, isWholeSeries: boolean) => Promise<boolean>;
  paths?: Readonly<Record<string, string>>;
  onOpenFolder?: (path: string) => void;
  onMoved?: (libraryId: string, jobId: string | null) => void;
  onOpenInCatalogue?: (address: CatalogueAddress) => void;
};

export type { MediaPanelProps, MediaReading };
