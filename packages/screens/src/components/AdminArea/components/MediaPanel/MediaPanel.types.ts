import type { Book } from '@ValenceContracts/schemas/Book';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

type MediaPanelProps = {
  isUnreachable?: boolean;
  libraries: readonly Library[];
  media: readonly MediaSummary[];
  albums?: readonly MusicAlbum[];
  books?: readonly Book[];
  onCorrect: (media: MediaSummary) => void;
  onCorrectAlbum?: (album: MusicAlbum) => void;
  onCorrectBook?: (book: Book) => void;
  onChooseMoment: (media: MediaSummary) => void;
  onRebuildArtefacts: (media: MediaSummary) => Promise<boolean>;
  onReencode?: (media: readonly MediaSummary[]) => void;
  onDelete?: (media: MediaSummary, isWholeSeries: boolean) => Promise<boolean>;
  paths?: Readonly<Record<string, string>>;
  onOpenFolder?: (path: string) => void;
};

export type { MediaPanelProps };
