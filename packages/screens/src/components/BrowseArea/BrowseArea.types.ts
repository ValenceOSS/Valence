import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type BrowseKind = 'shows' | 'films' | 'new' | 'favourites';

type BrowseAreaProps = {
  kind: BrowseKind;
  libraryId?: string | null;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onOpenShow?: (media: MediaSummary) => void;
  onItemsLoaded?: (items: MediaSummary[]) => void;
  watchedFractionFor?: (mediaId: string) => number | undefined;
  resumeFor?: (mediaId: string) => number | null;
  favourites?: string[];
  keptBooks?: string[];
  onOpenBook?: (book: Book) => void;
  isKept?: (mediaId: string) => boolean;
  onToggleKept?: (media: MediaSummary) => void;
  onHide?: (media: MediaSummary) => void;
  onAddLibrary?: () => void;
};

export type { BrowseAreaProps, BrowseKind };
