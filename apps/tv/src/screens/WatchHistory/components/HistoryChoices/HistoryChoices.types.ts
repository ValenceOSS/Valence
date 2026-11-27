import type { WatchedTitle } from '@ValenceClient/history/groupHistory';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

type HistoryChoicesProps = {
  watched: WatchedTitle;
  progress: ReadonlyMap<string, WatchProgress>;
  onPlay: (mediaId: string, startSeconds: number) => void;
  onOpen: (wanted: { kind: 'film' | 'show'; mediaId: string; seriesId?: string | null }) => void;
  onForget: (watched: WatchedTitle) => void;
  onClose: () => void;
};

export type { HistoryChoicesProps };
