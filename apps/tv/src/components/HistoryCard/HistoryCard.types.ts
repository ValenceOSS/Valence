import type { WatchedTitle } from '@ValenceClient/history/groupHistory';

type HistoryCardProps = {
  watched: WatchedTitle;
  width?: number;
  watchedFraction?: number;
  onPress: (watched: WatchedTitle) => void;
  onFocus: (watched: WatchedTitle) => void;
};

export type { HistoryCardProps };
