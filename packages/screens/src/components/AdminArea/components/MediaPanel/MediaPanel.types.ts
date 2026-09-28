import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

type MediaRow =
  | { kind: 'video'; media: MediaSummary }
  | { kind: 'album'; album: MusicAlbum }
  | { kind: 'book'; book: Book };

type MediaPanelProps = {
  isUnreachable?: boolean;
  media: MediaSummary[];
  albums?: MusicAlbum[];
  books?: Book[];
  onCorrect: (media: MediaSummary) => void;
  onCorrectAlbum?: (album: MusicAlbum) => void;
  onCorrectBook?: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onRebuildArtefacts: (media: MediaSummary) => Promise<boolean>;
  onReencode?: (media: MediaSummary) => void;
  onDelete?: (media: MediaSummary) => Promise<boolean>;
};

export type { MediaPanelProps, MediaRow };
