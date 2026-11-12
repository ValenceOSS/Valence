import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Rail } from '@ValenceClient/library/groupIntoRails';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type LibraryRailProps = {
  rail: Rail;
  isHome: boolean;
  progress: Map<string, WatchProgress>;
  flagOf: (media: MediaSummary) => string | null;
  onPlayFilm: (media: MediaSummary, startSeconds: number) => void;
  onPlayShow: (media: MediaSummary) => void;
  onInspect: (media: MediaSummary) => void;
  onOpenShow?: (media: MediaSummary) => void;
  isKept?: (mediaId: string) => boolean;
  onToggleKept?: (media: MediaSummary) => void;
  onHide?: (media: MediaSummary) => void;
  onDismiss?: (media: MediaSummary) => void;
};

export type { LibraryRailProps };
