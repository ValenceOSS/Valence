import type { TitlePlace } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { Book } from '@ValenceContracts/schemas/Book';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { CatalogueAddress } from '@ValenceScreens/components/AdminArea/components/CataloguePanel/CatalogueAddress.types';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type MediaTabProps = {
  libraries: readonly Library[];
  openedTitle?: string | null;
  onOpenTitle?: (id: string | null) => void;
  titlePlace?: TitlePlace;
  onTitlePlace?: (place: TitlePlace) => void;
  mayDelete: boolean;
  onOpenFolder?: (path: string) => void;
  onCorrect: (media: MediaSummary) => void;
  onChooseArtwork: (subject: ArtworkSubject) => void;
  onCorrectAlbum: (album: MusicAlbum) => void;
  onCorrectBook: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onReencode: (media: readonly MediaSummary[]) => void;
  onShowCopies: (media: MediaSummary, name: string) => void;
  onOpenInCatalogue?: (address: CatalogueAddress) => void;
};

export type { MediaTabProps };
