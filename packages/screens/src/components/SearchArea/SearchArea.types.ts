import type { Book } from '@ValenceContracts/schemas/Book';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type SearchKind = 'everything' | 'films' | 'shows' | 'music' | 'books';

type SearchAreaProps = {
  search: string;
  onSearchChange: (search: string) => void;
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
  onPlay: (media: MediaSummary, startSeconds: number) => void;
  onInspect: (media: MediaSummary) => void;
  onItemsLoaded?: (items: MediaSummary[]) => void;
  watchedFractionFor?: (mediaId: string) => number | undefined;
  resumeFor?: (mediaId: string) => number | null;
  isKept?: (mediaId: string) => boolean;
  onToggleKept?: (media: MediaSummary) => void;
  onHide?: (media: MediaSummary) => void;
  onOpenShow?: (media: MediaSummary) => void;
  onOpenBook?: (book: Book) => void;
  onAsk?: (asking: string) => void;
};

export type { SearchAreaProps, SearchKind };
