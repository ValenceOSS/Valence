import type { Book } from '@ValenceContracts/schemas/Book';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';
import type { ArtworkSubject } from '@ValenceScreens/components/AdminArea/components/ArtworkPicker/ArtworkPicker.types';

type MediaTabProps = {
  libraries: readonly Library[];
  mayDelete: boolean;
  onOpenFolder?: (path: string) => void;
  onCorrect: (media: MediaSummary) => void;
  onChooseArtwork: (subject: ArtworkSubject) => void;
  onCorrectAlbum: (album: MusicAlbum) => void;
  onCorrectBook: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onReencode: (media: readonly MediaSummary[]) => void;
  onShowCopies: (media: MediaSummary, name: string) => void;
};

export type { MediaTabProps };
