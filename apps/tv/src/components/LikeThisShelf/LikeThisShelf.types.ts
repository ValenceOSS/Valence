import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type LikeThisShelfProps = {
  mediaId: string | null;
  progress: ReadonlyMap<string, WatchProgress>;
  onOpen: (media: MediaSummary) => void;
};

export type { LikeThisShelfProps };
